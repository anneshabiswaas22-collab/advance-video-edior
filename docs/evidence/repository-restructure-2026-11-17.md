# Repository preservation and structure review

Client date: 17 November 2026. Baseline: `4323697f4b335220246e3a2a4b4a8e9969c3657a` on remote `main`.

The owner authorized extracting all three ZIPs, reorganizing this one project, preserving uncertain material under `AnalyseFuture/`, creating a detailed `.txt` product vision, and committing/pushing directly to main without PRs. The cloud checkout initially used the local name `work`; it was renamed to `main` at the existing commit, without creating a feature branch or rewriting history.

## Preservation and changes

- Baseline inventory captured 8,611 tracked files with SHA-256 hashes before changes.
- All three ZIPs passed CRC and path checks; 11,598 files were fully extracted and verified individually.
- Original ZIPs moved intact into `AnalyseFuture/archives/`; complete snapshots are under `AnalyseFuture/reference-sources/`.
- First preservation checkpoint `c8dfbaa` was committed and pushed to main before further restructuring.
- Four legacy automation files, one unrelated golf-project document, seven prototype files and two upstream mobile planning documents were relocated with original paths and content preserved.
- Five existing read-only CI/evaluation workflows remain active. No application source, dependency declarations, lockfiles or package paths were changed. One upstream spec's design-reference path was updated.
- Root navigation and handoff documents now point to the product idea, structure report and preservation map. Seven issue links in historical evidence/ADR documents were repaired. Original versions of revised existing documents were retained under `AnalyseFuture/recovery-originals/`.
- `PROJECT_IDEA.txt` records the current foundation, target workflows, architecture, a conditional one-year/two-year/later roadmap, ownership roles, AI limits and measurable acceptance gates. It describes a plan, not implemented feature claims.

## Validation

The previous cloud setup in this session passed workspace type checks, the production build, 3,420 unit tests (34 skipped), 24 Python media tests and two real Chromium checks. These historical results apply to that tested checkout; the structure change did not change executable application code. They do not establish Windows, real GPU or 4K readiness.

Post-restructure checks passed:

- `python3 scripts/verify_repository_preservation.py`: all 8,611 original tracked files, three ZIPs, 11,598 extracted files and 14 relocated files verified by SHA-256 and location checks.
- `python3 -m unittest discover -s tests -v`: 24 tests passed in 5.2 seconds.
- `CI=true pnpm --filter @openreel/studio exec playwright test -c /workspace/onboarding/playwright.config.ts`: two tests passed in 27.1 seconds using system Chromium. This exercised real project startup, import, store-backed split/trim, title/audio editing, IndexedDB save/recovery, MP4 export and decoded pixel/audio assertions.
- The earlier full build/typecheck/unit validation was reused because executable application source and dependencies were unchanged; those broader suites were not rerun for this documentation/file-layout change.

Archive integrity and preservation checks are independent of application behavior. No archived application or retired workflow was executed.

## Review limitations

The owner reported compromise. The review found an unrelated proposal, redundant snapshots and retired workflows able to push to main; these facts do not identify who changed them or prove a GitHub account compromise. No account audit logs, token inventory or collaborator permissions were inspected. This reorganization preserves evidence and keeps the working editor intact; it is not a certification that every dependency or repository file is safe.

See [the full structure report](../REPOSITORY_STRUCTURE.md) for paths, reasons, boundaries and future instructions. The owner-requested direct-main workflow was used with ordinary fast-forward pushes; no force push, destructive reset or history deletion was used.
