#!/usr/bin/env bash
# Reproducible lightweight clone/inventory of the publicly available source repos.
# NO external code is executed, imported into editor/, or redistributed by this script.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/editor-source-inventory"
mkdir -p "$DEST" "$ROOT/docs/evidence"
OUT="$ROOT/docs/evidence/supporting-source-inventory.md"

repos=(
  "Augani/openreel-video"
  "walterlow/freecut"
  "medhachim/CapRocket"
  "Vanilagy/mediabunny"
  "FFmpeg/FFmpeg"
  "ggml-org/whisper.cpp"
  "mltframework/mlt"
  "OpenCut-app/OpenCut"
)

cat > "$OUT" <<'HEADER'
# Public source repository inventory

GitHub Actions collected these commit hashes using shallow, sparse, read-only
clones. Each clone remained on the runner. **No upstream source beyond the
previously selected OpenReel foundation was copied into this product.**
A source revision and license file are not legal clearance for transitive
dependencies, model weights, codecs or media assets.

| Repository | Exact commit cloned | Root license file | State |
| --- | --- | --- | --- |
HEADER

failures=0
for name in "${repos[@]}"; do
  safe="${name//\//_}"
  directory="$DEST/$safe"
  if git clone --quiet --depth=1 --filter=blob:none --sparse "https://github.com/$name.git" "$directory"; then
    git -C "$directory" sparse-checkout set --no-cone README.md README LICENSE LICENSE.md LICENSE.txt LICENCE COPYING COPYING.LESSER COPYING.GPL LICENSES
    sha="$(git -C "$directory" rev-parse HEAD)"
    license="Not identified at root; review needed"
    for candidate in LICENSE LICENSE.md LICENSE.txt LICENCE COPYING COPYING.LESSER COPYING.GPL; do
      if [[ -f "$directory/$candidate" ]]; then
        license="$candidate"
        break
      fi
    done
    printf '| [%s](https://github.com/%s) | `%s` | %s | Cloned (sparse) |\n' "$name" "$name" "$sha" "$license" >> "$OUT"
    echo "Cloned $name at $sha"
  else
    printf '| [%s](https://github.com/%s) | — | — | CLONE FAILED |\n' "$name" "$name" >> "$OUT"
    echo "::warning::Sparse clone failed for $name"
    failures=$((failures + 1))
  fi
done

cat >> "$OUT" <<'FOOTER'

## Next actions
1. Check each project's exact source and component licenses before integration.
2. Run executable/benchmark checks only for viable modules.
3. Do NOT bulk-merge these repositories; select reusable APIs, libraries or compatible code.
4. Repeat with pinned SHAs after deciding to integrate a specific dependency.

Source snapshots are advisory; they do **not** establish performance, security or
commercial redistribution approval.
FOOTER

echo "$failures" > "$DEST/failed-clone-count"
echo "Inventory written to docs/evidence/supporting-source-inventory.md; failed=$failures"
