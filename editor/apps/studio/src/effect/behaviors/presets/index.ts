import type { BehaviorDef } from "../registry";
import { FIRE_AURA } from "./fire-aura.v1.ts";
import { SPARKLES_FACE } from "./sparkles.face.v1.ts";
import { GHOST_TRAIL } from "./ghost-trail.v1.ts";
import { CLONE_THREE } from "./clone.three.v1.ts";
import { AURA_GLOW } from "./aura-glow.v1.ts";
import { BACKGROUND_REPLACE } from "./background-replace.v1.ts";
import { FACE_TINT } from "./face-tint.v1.ts";
import { WARM_LOOK } from "./warm-look.v1.ts";
import { CINEMATIC_BARS } from "./cinematic-bars.v1.ts";
import { DREAMY } from "./dreamy.v1.ts";

export const ALL_PRESETS: BehaviorDef[] = [
  FIRE_AURA, SPARKLES_FACE, GHOST_TRAIL, CLONE_THREE, AURA_GLOW,
  BACKGROUND_REPLACE, FACE_TINT, WARM_LOOK, CINEMATIC_BARS, DREAMY,
];
