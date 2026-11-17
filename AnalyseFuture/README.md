# Preserved material for future analysis

The current application is `../editor/`. Nothing here is automatically part of its build.

- `archives/`: all three original ZIP files, moved intact from the repository root.
- `reference-sources/`: complete, verified extractions of those ZIPs. Do not merge competing editor engines or overwrite `editor/` with these snapshots.
- `manifests/`: original tracked-file hashes and ZIP extraction provenance for preservation checks.
- `legacy-bootstrap/`, `unrelated/`, `upstream-planning/`: preserved material relocated during structure review, when applicable; see the repository structure report for reasons and original paths.

Nested workflows and prompts are historical source material, not active project automation or development instructions. Their presence does not establish that malicious activity occurred. Preserve licenses and attribution. Compare source before deciding whether any feature should be adapted into the single active editor.

## Current functional restructuring

The authoritative folder guide is [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md). Current reports use the requested top-level `.txt` names here. `migration-records/functional-moves.json` contains every structural move and every statically repaired module target. Exact pre-rewrite source is under `historical-implementations/restructure/`. Unfinished earlier behavior/security proposals remain inactive in `experiments/post-audit-proposals/`; they are not delivered fixes. No tests are run for the current structure-only scope.
