/**
 * Bridge modules for connecting UI stores to core engines
 *
 * Bridges provide the integration layer between React/Zustand UI state
 * and the @openreel/core engine implementations.
 */

export {
  PlaybackBridge,
  getPlaybackBridge,
  initializePlaybackBridge,
  disposePlaybackBridge,
} from "../features/playback/bridges/playback-bridge";

export {
  RenderBridge,
  getRenderBridge,
  initializeRenderBridge,
  disposeRenderBridge,
  type RenderStats,
} from "../features/playback/bridges/render-bridge";

export {
  MediaBridge,
  getMediaBridge,
  initializeMediaBridge,
  disposeMediaBridge,
  type MediaBridgeImportResult,
  type ImportProgressCallback,
  type WaveformProgressCallback,
} from "../features/media/bridges/media-bridge";

export {
  AudioBridge,
  getAudioBridge,
  initializeAudioBridge,
  disposeAudioBridge,
  clampVolume,
  clampPan,
  applyVolume,
  calculatePanGains,
  applyPan,
  interpolateVolume,
  interpolatePan,
  getClipVolumeAtTime,
  getClipPanAtTime,
  VOLUME_MIN,
  VOLUME_MAX,
  PAN_MIN,
  PAN_MAX,
} from "../features/audio/bridges/audio-bridge";

export {
  EffectsBridge,
  getEffectsBridge,
  initializeEffectsBridge,
  disposeEffectsBridge,
  type VideoEffect,
  type VideoEffectType,
  type ColorGradingSettings,
  type EffectResult,
  type SerializedEffect,
  type SerializedColorGrading,
} from "../features/effects/bridges/effects-bridge";

export {
  AudioBridgeEffects,
  getAudioBridgeEffects,
  initializeAudioBridgeEffects,
  disposeAudioBridgeEffects,
  createEQEffect,
  createCompressorEffect,
  createReverbEffect,
  createDelayEffect,
  createNoiseReductionEffect,
  validateEQBand,
  validateCompressor,
  validateReverb,
  validateDelay,
  validateNoiseReduction,
  DEFAULT_EQ_BANDS,
  DEFAULT_COMPRESSOR,
  DEFAULT_REVERB,
  DEFAULT_DELAY,
  DEFAULT_NOISE_REDUCTION,
  type EQBandConfig,
  type CompressorConfig,
  type ReverbConfig,
  type DelayConfig,
  type SerializedNoiseProfile,
  type NoiseReductionFocus,
  type NoiseReductionConfig,
  type NoiseProfileData,
  type AudioEffectResult,
} from "../features/audio/bridges/audio-bridge-effects";

export {
  TextBridge,
  getTextBridge,
  initializeTextBridge,
  disposeTextBridge,
  type TextOperationResult,
  type CreateTextClipOptions,
  type UpdateTextStyleOptions,
  type TextAnimationOptions,
} from "../features/graphics/bridges/text-bridge";

export {
  GraphicsBridge,
  getGraphicsBridge,
  initializeGraphicsBridge,
  disposeGraphicsBridge,
  type GraphicsOperationResult,
  type CreateShapeOptions,
  type UpdateShapeStyleOptions,
  type ImportSVGOptions,
  type AddStickerOptions,
  type AddEmojiOptions,
} from "../features/graphics/bridges/graphics-bridge";

export {
  PhotoBridge,
  getPhotoBridge,
  initializePhotoBridge,
  disposePhotoBridge,
  type PhotoOperationResult,
  type AddLayerOptions,
  type RetouchingOptions,
  type BrushConfig,
} from "../features/graphics/bridges/photo-bridge";

export {
  TransitionBridge,
  getTransitionBridge,
  initializeTransitionBridge,
  disposeTransitionBridge,
  type TransitionOperationResult,
  type TransitionConfig,
  type TransitionTypeInfo,
} from "../features/transitions/bridges/transition-bridge";

export {
  getMotionTrackingBridge,
  resetMotionTrackingBridge,
  type MotionTrackingState,
  type MotionTrackingStateListener,
} from "../features/tracking/bridges/motion-tracking-bridge";

export {
  getBeatSyncBridge,
  initializeBeatSyncBridge,
  DEFAULT_BEAT_SYNC_OPTIONS,
  type BeatSyncState,
  type BeatSyncOptions,
} from "../features/audio/bridges/beat-sync-bridge";

export {
  SilenceCutBridge,
  getSilenceCutBridge,
  disposeSilenceCutBridge,
  DEFAULT_SILENCE_SETTINGS,
  type SilenceSettings,
  type SilentRegion,
  type SilenceAnalysisResult,
  type SilenceProgressCallback,
} from "../features/audio/bridges/silence-cut-bridge";
