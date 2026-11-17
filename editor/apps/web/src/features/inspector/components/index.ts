/**
 * Inspector Section Components
 *
 * Context-aware inspector sections for different clip types.
 */

// Video Effects
export { VideoEffectsSection } from "../../effects/components/VideoEffectsSection";
export { GreenScreenSection } from "../../effects/components/GreenScreenSection";
export { MaskSection } from "../../effects/components/MaskSection";
export { SpeedRampSection } from "../../speed/components/SpeedRampSection";
export { PiPSection } from "../../graphics/components/PiPSection";
export { NoiseReductionSection } from "../../audio/components/NoiseReductionSection";
export { BackgroundRemovalSection } from "../../effects/components/BackgroundRemovalSection";
export { CropSection } from "./CropSection";
export { SpeedSection } from "../../speed/components/SpeedSection";
export { StabilizationSection } from "../../tracking/components/StabilizationSection";

// Color Grading
export { ColorGradingSection } from "../../color/components/ColorGradingSection";
export {
  ColorWheelsControl,
  DEFAULT_COLOR_WHEEL_VALUES,
} from "../../color/components/ColorWheelsControl";
export { CurvesEditor, DEFAULT_CURVES } from "../../color/components/CurvesEditor";
export { LUTLoader } from "../../color/components/LUTLoader";
export { HSLControls, DEFAULT_HSL_VALUES } from "../../color/components/HSLControls";
export { ScopesPanel } from "../../color/components/ScopesPanel";
export type { ScopeViewType } from "../../color/components/ScopesPanel";
export { FilterPresetsPanel } from "../../color/components/FilterPresetsPanel";

// Text & Titles
export { TextSection } from "../../graphics/components/TextSection";
export { TextAnimationSection } from "../../graphics/components/TextAnimationSection";
export { AutoCaptionPanel } from "../../captions/components/AutoCaptionPanel";
export { AudioTextSyncPanel } from "../../audio/components/AudioTextSyncPanel";

// Graphics & Shapes
export { ShapeSection } from "../../graphics/components/ShapeSection";
export { SVGSection } from "../../graphics/components/SVGSection";
export { AlignmentSection } from "./AlignmentSection";
export { SVGImporter } from "../../graphics/components/SVGImporter";
export { StickerPicker } from "../../graphics/components/StickerPicker";
export { StickerPickerPanel } from "../../graphics/components/StickerPickerPanel";

// Audio
export { AudioEffectsSection } from "../../audio/components/AudioEffectsSection";
export { AudioDuckingSection } from "../../audio/components/AudioDuckingSection";
export { AutoCutSilenceSection } from "../../audio/components/AutoCutSilenceSection";
export { MusicLibraryPanel } from "../../audio/components/MusicLibraryPanel";
export { TextToSpeechPanel } from "../../audio/components/TextToSpeechPanel";

// Transitions & Keyframes
export { TransitionInspector } from "../../transitions/components/TransitionInspector";
export { ClipTransitionSection } from "../../transitions/components/ClipTransitionSection";
export { KeyframesSection } from "../../timeline/components/KeyframesSection";
export { BlendingSection } from "../../effects/components/BlendingSection";
export { Transform3DSection } from "./Transform3DSection";

// Motion Presets
export { MotionPresetsPanel } from "../../graphics/components/MotionPresetsPanel";

// Motion Paths
export { MotionPathSection } from "../../graphics/components/MotionPathSection";

// Emphasis Animation
export { EmphasisAnimationSection } from "../../graphics/components/EmphasisAnimationSection";

// Beat Sync
export { BeatSyncSection } from "../../audio/components/BeatSyncSection";

// Advanced Features
export { MotionTrackingSection } from "../../tracking/components/MotionTrackingSection";
export { NestedSequenceSection } from "../../projects/components/NestedSequenceSection";
export { AdjustmentLayerSection } from "../../effects/components/AdjustmentLayerSection";
export { MultiCameraPanel } from "../../multicam/components/MultiCameraPanel";
export { AutoReframeSection } from "../../tracking/components/AutoReframeSection";

// Photo Editing
export { PhotoLayersSection } from "../../graphics/components/PhotoLayersSection";
export { RetouchingSection } from "../../effects/components/RetouchingSection";

// Templates & History
export { TemplatesBrowserPanel } from "../../templates/components/TemplatesBrowserPanel";
export { TemplateVariablesPanel } from "../../templates/components/TemplateVariablesPanel";
export { HistoryPanel } from "../../projects/components/HistoryPanel";

// Markers & Scenes
export { MarkersPanel } from "../../projects/components/MarkersPanel";
export { SceneNavigatorPanel } from "./SceneNavigatorPanel";

// Particle Effects
export { ParticleEffectsSection } from "../../effects/components/ParticleEffectsSection";

// Text Behind Subject
export { BehindSubjectSection } from "../../effects/components/BehindSubjectSection";

