#!/usr/bin/env bash
# Bootstrap the video editor from a pinned, permissively licensed upstream.
# Use from the repository root. GitHub Actions runs this in CI and commits the result.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENREEL_SHA="367d7e90b61b5181f9861b852bb8b9d7a7d2954a"
FREECUT_SHA="5ceeeb388eef5423640b7db157706274bf1b8165"
STAGING="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/advanced-video-editor-upstreams"
mkdir -p "$STAGING"
cd "$ROOT"

if [[ -e editor/package.json ]]; then
  echo "editor/package.json already exists; refusing to overwrite working code"
  exit 0
fi
if [[ -e editor ]]; then
  echo "editor/ exists but has no package.json; refusing to overwrite"
  exit 1
fi

fetch_pinned() {
  local name="$1" remote="$2" sha="$3"
  if [[ ! -e "$STAGING/$name/.git" ]]; then
    git clone --depth=1 --filter=blob:none "$remote" "$STAGING/$name"
  fi
  if ! git -C "$STAGING/$name" cat-file -e "$sha^{commit}" 2>/dev/null; then
    git -C "$STAGING/$name" fetch --depth=1 origin "$sha"
  fi
  git -C "$STAGING/$name" checkout --detach "$sha"
  test "$(git -C "$STAGING/$name" rev-parse HEAD)" = "$sha"
}

# Clone these separately. The second editor is a comparator, not a dependency.
fetch_pinned openreel https://github.com/Augani/openreel-video.git "$OPENREEL_SHA"
fetch_pinned freecut https://github.com/walterlow/freecut.git "$FREECUT_SHA"

test -f "$STAGING/openreel/LICENSE"
grep -qi "MIT License" "$STAGING/openreel/LICENSE"
test -f "$STAGING/freecut/LICENSE"
grep -qi "MIT License" "$STAGING/freecut/LICENSE"

echo "Checked out OpenReel $OPENREEL_SHA and FreeCut $FREECUT_SHA"

# We deliberately import ONE editing engine. Do not merge source from FreeCut.
mkdir -p editor
rsync -a --exclude='.git' --exclude='.github' \
  --exclude='node_modules' --exclude='dist' --exclude='.next' \
  --exclude='.env' --exclude='.env.*' \
  "$STAGING/openreel/" "$ROOT/editor/"

cat > "$ROOT/editor/UPSTREAM_SOURCE.md" <<EOF
# Imported editing foundation

Source: https://github.com/Augani/openreel-video
Pinned commit: \`$OPENREEL_SHA\`
Original license: [LICENSE](LICENSE) (MIT; upstream copyright notices preserved)
Imported under \`editor/\` so the root media-QA harness remains independent.

FreeCut was cloned separately for structural comparison:
https://github.com/walterlow/freecut at \`$FREECUT_SHA\`.

This import does NOT prove successful builds, preview/export parity, or commercial
clearance for transitive dependencies, codecs, fonts, sample media and model weights.
DO NOT bulk-import other editors into this tree.
EOF

mkdir -p "$ROOT/docs/evidence"
cat > "$ROOT/docs/evidence/upstream-snapshot.md" <<EOF
# Upstream source snapshots

| Project | Revision | Role | Source license |
| --- | --- | --- | --- |
| [OpenReel](https://github.com/Augani/openreel-video) | \`$OPENREEL_SHA\` | Imported foundation | MIT, see \`editor/LICENSE\` |
| [FreeCut](https://github.com/walterlow/freecut) | \`$FREECUT_SHA\` | Comparison clone only | MIT, see upstream \`LICENSE\` |

Both upstream source trees were checked out at these revisions during this run.
Only OpenReel was copied into the application folder. A successful source import
is not the same as a functional editor benchmark; record build/test/export results separately.
EOF

echo "Imported OpenReel source into $ROOT/editor/ (no build validation yet)"
