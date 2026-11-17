# Project structure

Updated 17 November 2026. This organization follows the owner's instruction to group by actual responsibility, preserve all existing work, and perform this pass without tests. The active product remains one OpenReel-based browser/Windows editor, with companion creation tools. No competing editor engine was merged, no Git history was rewritten, and no files were discarded.

## Top-level homes

```text
advance-video-edior/
  PROJECT_STRUCTURE.md           This current organization guide
  PROJECT_IDEA.txt               Detailed product idea and future ambitions
  README.md                     Product entry and development commands
  AGENTS.md                     Owner and contributor rules
  editor/                       Application workspace and pinned dependencies
    apps/web/                   Browser editor and shared desktop renderer
    apps/desktop/               Electron main/preload, IPC and packaging
    apps/studio/                Effect/filter authoring and browser test tooling
    apps/image/                 Companion still-image editor
    apps/cloud/                 Optional backend; security review remains required
    packages/core/              Shared timeline, playback, audio, render and export
    packages/ui/                Shared UI primitives
    packages/agent*/            Typed editing automation and execution
    packages/creation-*/         Native/wasm creation contracts and adapters
    packages/image-core/        Still-image model and operations
    packages/fxpkg/             Effect-package contracts
    icons/                      Existing licensed/attributed icon source assets
    docs/                       Upstream technical documentation
    scripts/                    Workspace-native build/maintenance tools
  scripts/media/                FFmpeg fixture generation and media inspection
  scripts/repository/           File inventory and preservation tooling
  tests/                        Root media QA; retained but not run this pass
  docs/                         Project memory, architecture, research and evidence
  .github/workflows/            Five retained CI/evaluation definitions
  AnalyseFuture/                Preserved references, originals and recovery records
```

Package and application boundaries already correspond to distinct runtimes or responsibilities. They were retained deliberately. `editor/` is the package-manager workspace root; moving individual package roots would disrupt workspace dependencies, native builds and Electron resources. The image editor's still-image document model and Studio's effect authoring model are distinct responsibilities, not extra copies of the video timeline.

## Browser feature collections

```text
editor/apps/web/src/
  main.tsx, App.tsx, index.css    Framework bootstrap and root routing
  app/
    desktop/                    Desktop renderer shell and window/start flows
    hooks/                      Application lifecycle, routing and global shortcuts
    state/                      Shared engine, settings, theme and shell state
    services/                   App service worker and shortcut coordination
    engine-bridges.ts           Cross-feature engine integration barrel
  features/
    ai/                         Chat, model connections and typed editing agents
    generation/                 Optional external generation provider integration
    audio/                      Mixer, ducking, silence, speech and audio utilities
    captions/                   Caption editing, search and transcription worker
    color/                      Grading controls, curves, LUTs and scopes
    editor-shell/               Overall editor interface, toolbar and panel routing
    effects/                    Effect controls, masks, shaders and related bridges
    export/                     Export UI, presets, execution and compression
    graphics/                   Text, SVG, stickers, photo layers and motion presets
    inspector/                  Shared inspector navigation, tabs, hooks and shell
    media/                      Import/assets, recording, extraction and processing
    motion/                     Motion creator, compositions, assets and render queue
    multicam/                   Multi-camera analysis, transcription and workflows
    onboarding/                 Product tours and onboarding steps
    playback/                   Preview, proxy controls, playback and render bridge
    projects/                   Project state/history, persistence, recovery and fonts
    settings/                   General settings interface
    sharing/                    Shared-project viewing and highlight delivery
    speed/                      Clip speed and speed-ramp controls
    templates/                  Template discovery, variables and save controls
    timeline/                   Timeline UI, editing helpers, keyframes and playhead
    tracking/                   Reframing, stabilization and tracking controls
    transitions/                Transition editing and integration
  shared/
    components/                 Cross-feature UI, notifications and design primitives
    config/                     Shared capability/endpoint configuration
    icons/                      App icon components
    services/                   Shared provider transport and credential storage
    types/                      Cross-feature/runtime types
    utils/                      Utilities with multiple feature consumers
  test/                         Framework test setup; not an application feature
```

Each feature retains its useful internal layers (`components/`, `bridges/`, `services/`, `state/`, `utils/`, `workers/` or `hooks/`). A folder exists only when that feature has files in that role. Tests remain beside their owning implementations. Inspector shell/tab orchestration stays together while concrete audio/color/text/etc. sections now live with those features. The project store remains one cohesive authority; its reducers were not split into competing domain stores.

Cross-feature imports are explicit. Shared code is reserved for genuine cross-feature concerns, not every file that is inconvenient to classify. `@/` continues to mean the web `src/` root. Vite framework entry points, CSS entry, public assets, functions, native ABI sources and package entry points retain their conventions.

## Preserved work and uncertain material

```text
AnalyseFuture/
  archives/                     Three unchanged original ZIPs
  reference-sources/             Complete independent source extractions
  duplicate-implementations/     Disconnected Studio effect prototype and FireScene
  experiments/post-audit-proposals/
                                Unfinished earlier behavior/security proposals
  historical-implementations/
    restructure/                Exact originals before import/path rewrites
    consolidation/, security/   Earlier proposal baselines
  recovery-originals/           Original handoff documents from the first cleanup
  legacy-automation/            Inactive repository-writing workflows and scripts
  upstream-planning/            Preserved design prototypes and mobile marketing
  unrelated/                    Preserved out-of-scope golf project proposal
  manifests/                    Baselines, archive hashes and relocation records
  migration-records/            Functional moves and module-reference mapping
  repository-inventory/         Per-file hashes, ownership and dependency records
  *.txt                         Recovery reports, roadmap and continuation guidance
```

`AnalyseFuture/` is outside the active `editor/apps/*` and `editor/packages/*` workspace globs. Nested archived workflows are outside `.github/workflows/`. No archived dependencies or scripts were installed or executed. Archiving does not establish safety; review suspicious content before restoring it.

The unused Studio `components/effect/EffectEditor.tsx` and its private `FireScene.tsx` were preserved together. Studio's actual App imports `src/effect/EffectEditor.tsx`; that implementation stays active. Shared `data.ts` stays because active template authoring uses it. Exported legacy core implementations remain in place where removing them would change public APIs without adequate validation.

## How every path is accounted for

`AnalyseFuture/COMPLETE_FILE_INVENTORY.txt` contains one row per tracked or explicitly included source/report path, including deeply nested archived material. Machine-readable rows record file content hashes, size, mode, status, owner, inferred purpose and static dependencies. Binary assets are hashed/classified; text sources are read for import/content analysis. The reports distinguish this automated coverage from deeper semantic review; they do not claim every line has been manually certified or every feature works.

`AnalyseFuture/manifests/relocations.json` and `AnalyseFuture/migration-records/functional-moves.json` identify every moved file. Originals of rewritten files are retained byte-for-byte under `historical-implementations/restructure/`. The former location is never the only surviving record.

No tests, build, typecheck or lint suite is run for this structure-only pass. Static file inventory, reference resolution and preservation accounting are organizational checks, not evidence that application behavior survived the migration. Run the documented validation in a subsequent authorized task before release.

## Where new work belongs

Find the owning feature first. Place its UI, integration, state helpers and colocated tests inside that collection. Put reusable engine behavior in the existing core domain package, not in a second timeline. Keep runtime-specific native/server entry points inside their applications. Preserve uncertain implementations under a reasoned `AnalyseFuture/` collection with their original path and replacement relationship documented.

Commit and push directly to `main`, without PRs or force-pushes. Make a checkpoint within five minutes while modifying files. Preserve concurrent work and never discard a file merely because it looks duplicated or unfamiliar.

Local ignored dependency/build/cache paths are also listed separately in `AnalyseFuture/repository-inventory/ignored-runtime-paths.txt`; these are runtime state, not extra source to commit or reorganize.
