# Security recovery status

Owner scope confirmed 18 November 2026: continue full security recovery, necessary validation and careful functional restructuring. This supersedes the former structure-only/no-test scope. Preserve history and attribution; do not infer an attacker from commit metadata or unfamiliar files. No deployment or paid-provider operations are authorized by this recovery work.

## Baseline and checkpoints

- Starting checkout and remote main: `029a3e1346d1c00e1838e6bd304f45499cb2a078`; initial worktree clean. The environment's local branch is `work`; ordinary `HEAD:main` pushes preserve the recorded direct-main workflow without creating feature branches.
- Verified repair checkpoint: [`2afa2a1`](https://github.com/anneshabiswaas22-collab/advance-video-edior/commit/2afa2a1f1beaadfb1c5d129e8a1d85963fb756c0). Native Git confirmed remote main at that full SHA after pushing.
- Recovery instructions/CI checkpoint `314288d`; cloud fail-closed mitigation `4842c66`; desktop URL mitigation `5b15d6e`. Ordinary push and remote lookup confirmed main at `5b15d6e5437a36ceb1a1cf008befa1486d2bf986` after both security checkpoints.
- A complete-history bundle is retained outside the checkout at `/workspace/onboarding/recovery-baseline.bundle`. `git bundle verify`, a bare restoration into `/workspace/onboarding/recovery-restore-check.git`, baseline commit lookup and connectivity checking succeeded. This local backup has not been uploaded or published.
- Exact pre-repair files and SHA-256 metadata are retained under `AnalyseFuture/historical-implementations/recovery-validation/`. Existing preservation manifests and expected hashes were not weakened.

## Verified migration repairs

| File | Baseline failure | Repair |
| --- | --- | --- |
| `editor/apps/studio/src/effect/behaviors/presets/index.ts` | Ten TS5097 errors after `e44c20c` added `.ts` import suffixes | Restore original extensionless imports, without loosening TypeScript options |
| `tests/test_check_media.py` | Decode-failure test raises `AttributeError` before invoking its assertion | Point mocks at the actual `scripts.media.check_media` module |
| `editor/apps/studio/e2e-web/main-editor-edit-export.spec.ts` | Export created, but Python validation fails because old script path is missing | Invoke both validators from `scripts/media/`; retain original assertions |

The before/after ownership tree is unchanged: `editor/apps/*` are application surfaces, `editor/packages/*` are shared implementations, `scripts/media/` is media QA, and `AnalyseFuture/` is preserved/reference material. No active modules, original archives, licensed assets or historical documents were deleted. There is still one canonical editor foundation.

## Current validation evidence

Toolchain: Node `24.22.1`, pnpm `11.7.0`, Linux, system Chromium, FFmpeg/ffprobe. CI declares Node 22; Windows/native/GPU/4K qualification has not been performed here.

Activate `PATH=/workspace/onboarding/tools/node_modules/.bin:$PATH`; editor commands run in `editor/`, Python commands at repository root. The following were executed against the repaired source in checkpoint `2afa2a1`, not merely quoted from historical reports:

| Command | Result |
| --- | --- |
| `python3 scripts/repository/verify_repository_preservation.py` | PASS: 8,611 originals, 3 ZIPs, 11,598 extracted files and 635 relocations |
| `python3 -m unittest discover -s tests -v` | PASS: 24 tests, zero skips; baseline had one error |
| `pnpm typecheck` | PASS across workspace; baseline Studio had ten TS5097 errors |
| `pnpm --filter @openreel/studio test:run` | PASS: 68 tests in 16 files, zero skips |
| `pnpm --filter @openreel/studio build` | PASS; nonfatal chunk-size/outdated-browser-data warnings |
| `pnpm --filter @openreel/studio exec playwright test -c /workspace/onboarding/recovery-playwright.config.mjs` | PASS: 2 browser tests; baseline had one failed export validation and one startup pass |

The external Playwright override uses `/usr/bin/chromium`, runs both existing `e2e-web` specs with one worker, and retains artifacts outside source control at `/workspace/onboarding/recovery-test-results/`. Commands and processes are current-machine evidence, not proof of a published environment or restored future task.

The edited MP4 is 640×360 H.264 at 24 fps, 2.020 seconds, with Opus audio. Full decode passed. Red/blue sample-frame mean absolute errors were 8.333/5.000, below the unchanged threshold 30. The title region differs from the source by 25.966, above threshold 4. Audio windows measured −18.070/−18.069 dBFS, above threshold −40. The JSON report has five passing checks and no failures. This is not proof of AAC compatibility, exact audio phase alignment or every export preset.

## Security ledger and ongoing fixes

| Finding | Verified evidence | Status / next action |
| --- | --- | --- |
| Caller-forged cloud identity | `apps/cloud/src/marketplace/auth.ts` trusts arbitrary bearer/user/creator headers in baseline | Mitigated: protected APIs return 503 before storage access; verified identity still unimplemented; no cloud deployment |
| Creator self-review/publication | `marketplace/studio.ts` review routes use creator guard; baseline API test approves with submitting creator's headers | Mitigated: review APIs disabled via separate reviewer guard; no actual reviewer identity policy claimed |
| Legacy unauthenticated template writes/deletes | `apps/cloud/src/index.ts` POST/DELETE template handlers | Mitigated: fail closed pending verified auth/ownership; AI highlighting and financial events likewise disabled before side effects |
| Expression execution | Both baseline motion/effects evaluators use `new Function` | Replaced with Acorn-parsed restricted data expressions: no globals, prototype access, dynamic JS compilation, loops or arbitrary statements. Source/AST/cache/operation limits; supported arithmetic, Math, trusted layer/effect handles and immutable const+return expressions remain |
| Desktop URL fetch | Initial-host-only checks, automatic redirects, full buffering before size checks | Mitigated: public IP literals only; validate every redirect, stream within hard byte cap and 30-second timeout. Hostname URL import intentionally disabled until DNS-pinned transport exists; download separately and import locally |
| Desktop filesystem IPC | Renderer-selected paths; capability/allowed-root and sender review required | Unresolved; local path syntax checks alone are insufficient |
| Account compromise | No account/audit evidence obtained | Unconfirmed; source/history cannot establish account control |

GitHub Actions API reads through the existing `gh` configuration return **Forbidden** for this repository. Git read/push works, but CI status, account sessions, collaborators, app grants and protection settings have not been verified. Do not call CI green based on local tests or request a raw token merely because API access is unavailable.

Cloud focused validation: 23 tests pass with zero skips and TypeScript passes. The new denial tests fail on the vulnerable baseline; they cover forged/missing identity, environment modes, malformed bodies and absence of bucket/ledger/AI side effects. Successful header-only authoring expectations were removed from the active API contract, preserved exactly as history, and replaced with public-read and negative authorization checks. This intentionally disables protected cloud features; it is not a functioning production authentication service. Public sharing/upload and crash intake still need abuse controls.

Desktop URL focused validation: 47 mocked-transport cases pass and TypeScript passes. No external request was used to test private-address rejection. Windows native execution remains unrun.

Expression focused validation: 98 tests pass across five files; core TypeScript passes. Independent static review caught a legacy unbounded smoothing helper and oversized cache-key retention; both were corrected before checkpointing. Invalid/malicious expressions fall back to the property value rather than executing JavaScript. Acorn 8.15.0 was already in the dependency lock and is now an explicit core dependency (three added lock lines). This is a restricted language, not arbitrary JavaScript compatibility. Source size bounds the parser input, while broader project/keyframe/model size limits still require review.

## Bounded inventory and dependency scan

At checkpoint `2afa2a1`, 20,668 tracked paths (486,314,043 bytes) were hashed with zero read errors. Machine-readable inventory, duplicate groups, credential indicators and execution-surface summaries are retained outside the checkout under `/workspace/onboarding/recovery-audit/`; giant generated reports were not added to source control. Categories include 11,598 reference paths, 6,706 assets, 1,164 active-source paths and 501 tests. Classification is automated path/content evidence, not semantic validation of every feature.

Eight high-confidence credential formats had zero matches across 20,086 text paths. The 582 excluded binary/oversized files, ignored/untracked files and commit history are outside that credential-scan coverage. No secret or malware-absence certification follows from this result. Of 8,562 duplicate groups, only four have multiple active members: TypeScript/PostCSS configs, asset declarations and empty Python initializers. No redundant active business engine was established; no duplicate was deleted. Two active Aurora Mach-O arm64 binaries match the preserved OpenReel reference exactly; no binaries were executed. Sixteen active manifests have no install/postinstall/prepare hooks; the Electron dependency build is explicitly allowed. Five active workflows use read-only contents permissions, with no `pull_request_target`; action tag pinning still needs supply-chain review.

`pnpm audit --prod --json` completed with exit 1: 71 advisory records (1 critical, 17 high, 45 moderate, 8 low). The critical record concerns protobufjs 7.5.4; a compatible targeted update is being prepared. Advisory presence does not establish exploitation/reachability. The complete current-machine JSON is `/workspace/onboarding/recovery-dependency-audit.json`. Native sharp and Zod 3 consumers require compatibility work; do not apply blanket major-version overrides or claim the audit is clean.

## Feature verification matrix

| Workflow / feature family | Evidence in this follow-up | Still unverified |
| --- | --- | --- |
| Project create/timeline mount/empty export guard | Real Chromium UI pass | Native Windows |
| Video/audio import, title placement | Real UI import/placement and decoded export | Codec variants, huge/corrupt media |
| Split/trim/title timing | Mounted real editor store plus saved/exported result | Mouse/keyboard split and trim gestures, all undo/redo combinations |
| Save/reopen/media recovery | Real IndexedDB save, page reload and recovered media | Browser restart/new context, quota and missing-file recovery |
| MP4 export | Real download, ffprobe, full decode, frame/title/audio checks | All presets, cancellation/failures, sample-accurate sync |
| Studio presets/compilation | 68 unit tests, typecheck, production build | Full Studio UI workflow |
| Track lock/mute, transitions, masks, audio mixing/ducking, captions, speed/color/proxies/waveforms | Existing implementations/tests; no new end-to-end certification in this checkpoint | Independent UI/persistence/undo/export checks for each family |
| Templates/recording/multicam/tracking/stabilization | Source presence only in this checkpoint | Complete functional qualification |
| AI/provider failures | No paid service called | Trust/permission review and fake-provider failure flows |
| Desktop IPC/packaging | Static security review in progress | Native Windows, packaged integrations, real GPU/4K |
| Cloud/image companions | Separate components retained; cloud security work in progress | Supported secure cloud deployment, image UI workflow |

## Next gates and owner account checks

1. Complete deny-by-default cloud mitigation and negative tests before any cloud deployment; implement verified identity/ownership/reviewer policy separately.
2. Replace dynamic expression execution with a bounded restricted interpreter, preserving supported safe expression semantics.
3. Harden desktop URL transport and filesystem capabilities; explicitly report any disabled feature or unsupported safe transport.
4. Run final affected tests, workspace checks and real decoded export on the combined security changes; preserve failures/skips distinctly.
5. Verify published checkpoint SHAs and CI if GitHub API access becomes available; then expand real UI gestures, cross-session recovery and frame/audio precision coverage before new feature claims.

Owner-only account review if unauthorized access remains suspected: inspect active sessions and 2FA, PATs/deploy keys, OAuth/GitHub App grants, collaborators, Actions token permissions and audit logs. Revoke unauthorized access and rotate exposed credentials through secure settings. No attacker attribution or claim of account remediation is made here.
