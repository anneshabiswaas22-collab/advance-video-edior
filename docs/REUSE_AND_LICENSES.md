# Reuse-first policy and third-party review

The libraries below are **candidates, not dependencies or approvals**. Validate the exact version, distribution method and all transitive/model/asset licenses before inclusion. Commercial licensing may require legal review.

| Category | Candidate | Evaluation purpose |
| --- | --- | --- |
| Browser media | https://github.com/Vanilagy/mediabunny | Prefer the editor's existing integration; avoid duplicate media pipelines |
| Native processing | https://github.com/FFmpeg/FFmpeg | Encoding, containers, filters; check actual LGPL/GPL build flags |
| Audio/transcription | https://github.com/ggml-org/whisper.cpp | Offline captions, only if candidate lacks adequate solution |
| Silence removal | https://github.com/snakers4/silero-vad | Speech activity detection; track model-weight licenses |
| Shot detection | https://github.com/Breakthrough/PySceneDetect | Analyze footage and suggest scene splits |
| Speech cleanup | https://github.com/xiph/rnnoise | Optional native audio denoising |
| FX/transitions | https://github.com/gl-transitions/gl-transitions | Reuse compatible licensed shaders instead of writing new ones |
| Object segmentation | https://github.com/facebookresearch/sam2 | Later advanced AI module; benchmark GPU/RAM needs |
| Interchange | https://github.com/AcademySoftwareFoundation/OpenTimelineIO | Professional timeline interchange; not a render engine |
| Color management | https://github.com/AcademySoftwareFoundation/OpenColorIO | Professional color transform infrastructure; not a grading UI |
| UI components | https://github.com/shadcn-ui/ui | Only if consistent with selected editor's stack |
| Other editors | https://github.com/medhachim/CapRocket | Examine specific compatible code patterns; do NOT merge whole app |

## Mandatory license checks

- Store selected component name, version/commit, source URL, package license, transitive licenses, model-weight license, and attribution obligations.
- Verify whether FFmpeg binaries are LGPL/GPL, whether codecs affect redistribution, and whether a proprietary distribution is compatible.
- Keep code licenses distinct from pretrained checkpoints, fonts, templates, sound effects, samples and stock media.
- Do not include noncommercial music models/weights in a commercial release based only on an MIT-licensed code repository.
- Preserve upstream license/copyright notices in the final distribution.
- When uncertain, document BLOCKED and do not ship the candidate.

## Performance and cost safeguards

First check whether the chosen foundation already provides the feature. Then prefer an existing dependency, a small adapter, an additional library, and finally fresh implementation in that order. Choose only if measured benefit exceeds integration/maintenance costs. Paid AI usage must be explicit and opt-in; use a stub/mock in CI.

**Goal:** minimize total cost of reliable functionality, not maximize number of repositories.
