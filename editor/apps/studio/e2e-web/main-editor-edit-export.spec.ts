import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(process.cwd(), "../../..");

function run(command: string, args: string[]) {
  execFileSync(command, args, {
    cwd: root, encoding: "utf8", timeout: 120_000, maxBuffer: 4 * 1024 * 1024,
  });
}

test("main editor really imports, edits, recovers and exports MP4", async ({ page }, info) => {
  test.setTimeout(240_000);
  const fixtureDir = info.outputPath("fixtures");
  mkdirSync(fixtureDir, { recursive: true });
  const source = join(fixtureDir, "sample-colors.mp4");
  const voice = join(fixtureDir, "narration.wav");
  const exported = info.outputPath("edited-output.mp4");
  const report = info.outputPath("edited-content-report.json");
  const specPath = info.outputPath("edited-expectations.json");

  // Distinct shots make frame/cut mistakes observable; audio is real PCM/AAC.
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", "color=c=red:s=640x360:r=24:d=1",
    "-f", "lavfi", "-i", "color=c=blue:s=640x360:r=24:d=2",
    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000:duration=3",
    "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]",
    "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-ac", "2", "-t", "3", "-movflags", "+faststart", source,
  ]);
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=48000:duration=2",
    "-c:a", "pcm_s16le", voice,
  ]);

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#/new?dimensions=640x360&fps=24");
  await expect(page.locator("#editor-panel-timeline")).toBeVisible({ timeout: 45_000 });

  // A fresh browser automatically starts the product's interactive onboarding tour.
  // Dismiss it through the real accessible UI; otherwise the spotlight overlay
  // intercepts media-tile clicks even though import succeeded.
  await page.getByRole("button", { name: "Skip tour" }).first().click({ timeout: 20_000 });

  const importInput = page.locator('input[type="file"][aria-label="Import media"]');
  await importInput.setInputFiles(source);
  const videoName = page.getByText("sample-colors.mp4", { exact: true });
  await expect(videoName).toBeVisible({ timeout: 60_000 });
  await videoName.locator("..").locator('[draggable="true"]').dblclick();
  await expect(page.getByRole("button", { name: "Export", exact: true }))
    .toBeEnabled({ timeout: 45_000 });

  // Invoke the real editor command store shared with the mounted Chromium UI;
  // no mocked timeline, media decoder, project data, or export engine.
  const splitClips = await page.evaluate(async () => {
    const { useProjectStore } = await import("/src/stores/project-store.ts");
    const state = useProjectStore.getState();
    const original = state.project.timeline.tracks
      .find((track) => track.type === "video" && track.clips.length > 0)?.clips[0];
    if (!original) throw new Error("Video was not placed on the timeline");
    const split = await state.splitClip(original.id, 1);
    if (!split.success) throw new Error("Split failed: " + split.error?.message);
    const right = useProjectStore.getState().project.timeline.tracks
      .flatMap((track) => track.clips)
      .find((clip) => clip.mediaId === original.mediaId && Math.abs(clip.startTime - 1) < 0.02);
    if (!right) throw new Error("Split did not produce the right-hand clip");
    const trim = await useProjectStore.getState().trimClip(right.id, undefined, 2);
    if (!trim.success) throw new Error("Trim failed: " + trim.error?.message);
    return useProjectStore.getState().project.timeline.tracks
      .flatMap((track) => track.clips).length;
  });
  expect(splitClips).toBeGreaterThanOrEqual(2);

  await importInput.setInputFiles(voice);
  const audioName = page.getByText("narration.wav", { exact: true });
  await expect(audioName).toBeVisible({ timeout: 60_000 });
  await audioName.locator("..").locator('[draggable="true"]').dblclick();

  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page.getByRole("button", { name: "Add Title" }).click();
  const saved = await page.evaluate(async () => {
    const { useProjectStore } = await import("/src/stores/project-store.ts");
    const store = useProjectStore.getState();
    const title = store.getAllTextClips()[0];
    if (!title) throw new Error("Text UI did not create a title");
    if (!store.updateTextContent(title.id, "E2E TITLE")) {
      throw new Error("Title content was not updated");
    }
    if (!store.updateOverlayClipTiming(title.id, { startTime: 0, duration: 1.7 })) {
      throw new Error("Title was not trimmed");
    }
    const project = useProjectStore.getState().getFullProject();
    if (!project.timeline.tracks.some((track) =>
      track.type === "audio" && track.clips.length > 0)) {
      throw new Error("Separate audio track is missing");
    }
    const { autoSaveManager } = await import("/src/services/auto-save.ts");
    await autoSaveManager.forceSave(project);
    const snapshots = await autoSaveManager.checkForRecovery(project.id);
    if (!snapshots.length) throw new Error("Project is missing from IndexedDB");
    return {
      id: project.id,
      tracks: project.timeline.tracks.map((track) => ({
        type: track.type,
        clips: track.clips.map((clip) => ({
          startTime: clip.startTime, duration: clip.duration, mediaId: clip.mediaId,
        })),
      })),
      text: project.textClips?.[0]?.text,
      mediaCount: project.mediaLibrary.items.length,
    };
  });
  expect(saved.text).toBe("E2E TITLE");
  expect(saved.mediaCount).toBeGreaterThanOrEqual(2);

  // Reopen from the real auto-save database and confirm original media resolves.
  await page.reload();
  await page.getByRole("button", { name: "Recover Project", exact: true })
    .click({ timeout: 45_000 });
  await expect(page.locator("#editor-panel-timeline")).toBeVisible({ timeout: 45_000 });
  const restored = await page.evaluate(async () => {
    const { useProjectStore } = await import("/src/stores/project-store.ts");
    const state = useProjectStore.getState();
    return {
      id: state.project.id,
      tracks: state.project.timeline.tracks.map((track) => ({
        type: track.type,
        clips: track.clips.map((clip) => ({
          startTime: clip.startTime, duration: clip.duration, mediaId: clip.mediaId,
        })),
      })),
      text: state.getAllTextClips().map((item) => ({ text: item.text, duration: item.duration })),
      missing: state.project.mediaLibrary.items
        .filter((item) => item.isPlaceholder).map((item) => item.name),
      mediaCount: state.project.mediaLibrary.items.length,
    };
  });
  expect(restored.id).toBe(saved.id);
  expect(restored.tracks).toEqual(saved.tracks);
  expect(restored.text).toContainEqual({ text: "E2E TITLE", duration: 1.7 });
  expect(restored.mediaCount).toBe(saved.mediaCount);
  expect(restored.missing).toEqual([]);

  // Real Toolbar export; assert downloaded bytes, not just a progress bar.
  const downloadPromise = page.waitForEvent("download", { timeout: 150_000 });
  await page.getByRole("button", { name: "Export options" }).click();
  await page.getByText("MP4 Standard", { exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs(exported);
  await info.attach("edited-output", { path: exported, contentType: "video/mp4" });

  run("python3", [
    resolve(root, "scripts/check_media.py"), exported, "--require-audio",
    "--min-width", "640", "--min-height", "360",
    "--min-seconds", "1.85", "--max-seconds", "2.15",
    "--video-codec", "h264", "--decode",
  ]);
  writeFileSync(specPath, JSON.stringify({
    frames: [
      { time: 0.94, region: [0.05, 0.05, 0.12, 0.12],
        expected_rgb: [253, 0, 0], max_mae: 30 },
      { time: 1.04, region: [0.05, 0.05, 0.12, 0.12],
        expected_rgb: [0, 0, 254], max_mae: 30 },
      { time: 0.5, region: [0.15, 0.18, 0.7, 0.65],
        reference: "fixtures/sample-colors.mp4", reference_time: 0.5,
        min_mae: 4, max_mae: 255 },
    ],
    audio_windows: [
      { start: 0.3, end: 0.55, min_rms_dbfs: -40 },
      { start: 1.4, end: 1.6, min_rms_dbfs: -40 },
    ],
  }, null, 2));
  run("python3", [
    resolve(root, "scripts/check_edit_content.py"),
    exported, specPath, "--report", report,
  ]);
  await info.attach("decoded-content-measurements", {
    path: report, contentType: "application/json",
  });
  expect(errors).toEqual([]);
});
