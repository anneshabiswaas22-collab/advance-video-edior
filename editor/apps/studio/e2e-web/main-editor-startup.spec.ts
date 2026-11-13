import { test, expect } from "@playwright/test";

test("main web editor creates a real project and guards empty exports", async ({ page }) => {
  const uncaughtErrors: string[] = [];
  page.on("pageerror", (error) => uncaughtErrors.push(error.message));

  await page.goto("/#/new?dimensions=1920x1080&fps=24");

  // Assert that the real lazy-loaded editor (rather than a loading screen)
  // has mounted after project creation.
  await expect(page.locator("#editor-panel-timeline")).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByRole("textbox", { name: "Project name" }))
    .toHaveValue(/New Horizontal Video/);

  // Empty projects should not silently export a blank MP4.
  await expect(page.getByRole("button", { name: "Export", exact: true }))
    .toBeDisabled();

  expect(uncaughtErrors).toEqual([]);
});
