# Public source repository inventory

GitHub Actions collected these commit hashes using shallow, sparse, read-only
clones. Each clone remained on the runner. **No upstream source beyond the
previously selected OpenReel foundation was copied into this product.**
A source revision and license file are not legal clearance for transitive
dependencies, model weights, codecs or media assets.

| Repository | Exact commit cloned | Root license file | State |
| --- | --- | --- | --- |
| [Augani/openreel-video](https://github.com/Augani/openreel-video) | `367d7e90b61b5181f9861b852bb8b9d7a7d2954a` | LICENSE | Cloned (sparse) |
| [walterlow/freecut](https://github.com/walterlow/freecut) | `5ceeeb388eef5423640b7db157706274bf1b8165` | LICENSE | Cloned (sparse) |
| [medhachim/CapRocket](https://github.com/medhachim/CapRocket) | `1cab5263768180526b751ce44eb39308ccd10ffe` | Not identified at root; review needed | Cloned (sparse) |
| [Vanilagy/mediabunny](https://github.com/Vanilagy/mediabunny) | `173f6b70765fa3a6ffc1c82737514416fa559ef5` | LICENSE | Cloned (sparse) |
| [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) | `7d871d13196b3101445416caa6ee9f611793cccc` | LICENSE.md | Cloned (sparse) |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | `d2c6f05a46dacf663e357bcf0ed40f542a72825d` | LICENSE | Cloned (sparse) |
| [mltframework/mlt](https://github.com/mltframework/mlt) | `2a51ed9cca0b7edca5f1c34749bad67b76b0051a` | COPYING | Cloned (sparse) |
| [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut) | `e668010778568641babef2cc40be4703ae6916d6` | LICENSE | Cloned (sparse) |

## Next actions
1. Check each project's exact source and component licenses before integration.
2. Run executable/benchmark checks only for viable modules.
3. Do NOT bulk-merge these repositories; select reusable APIs, libraries or compatible code.
4. Repeat with pinned SHAs after deciding to integrate a specific dependency.

Source snapshots are advisory; they do **not** establish performance, security or
commercial redistribution approval.
