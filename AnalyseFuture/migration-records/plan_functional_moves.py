from pathlib import Path
import json,subprocess
root=Path('/workspace/advance-video-edior'); web='editor/apps/web/src/'; moves={}
paths=[p for p in subprocess.check_output(['git','ls-files','-z'],cwd=root,text=True).split('\0') if p]
def feature_for(name):
 stem=Path(name).name.split('.')[0].lower()
 groups={
 'audio':['audioducking','audioeffects','audioresult','audiotextsync','autocutsilence','beatsync','musiclibrary','noisereduction','texttospeech','voicebrowser','voiceover','tts-','audio-','silence-cut','beat-sync','separate-audio','load-audio-buffer','whisper-audio'],
 'captions':['autocaption','captioneditor','caption-search','linked-caption-edit'],
 'color':['colorgrading','colorwheels','curveseditor','filterpresets','hslcontrols','lutloader','scopespanel'],
 'tracking':['autoreframe','motiontracking','motion-tracking','stabilization'],
 'effects':['adjustmentlayersection','backgroundremoval','behindsubject','blending','greenscreen','masksection','particleeffects','retouching','shadercontrols','videoeffects','effects-bridge','ai-shader','effectstransitions'],
 'transitions':['cliptransition','transitioninspector','transition-bridge'],
 'graphics':['emphasisanimation','enhancedtext','motionpathsection','motionpresets','photolayers','pipsection','svgimporter','svgsection','shapesection','stickerpicker','textanimation','textsection','graphics-bridge','photo-bridge','text-bridge','motion-presets','video-effect-stack'],
 'speed':['speedramp','speedsection'],
 'multicam':['multicamera','multicam-'],
 'templates':['templatevariables','templatesbrowser','editingtemplate','recipestab','templatestab','savetemplate','template-cloud'],
 'export':['exportdialog','exportprogressoverlay','compressdialog','export-','video-compressor'],
 'projects':['historypanel','markerspanel','nestedsequence','projectpackage','projectswitcher','auto-save','project-','project.','project/','font-catalog','project-fonts','project-names'],
 'media':['assetspanel','processingoverlay','recordingcontrols','recordingcountdown','screenrecorder','media-bridge','media-storage','stable-media','media-recovery','screen-recorder','native-ffmpeg','processing-manager'],
 'playback':['preview','playback-','render-bridge'],
 'timeline':['timeline','quickedit','quick-edit','editing-frame','keyframeeditor','keyframessection','timeline-item-actions','frame-timecode'],
 'sharing':['sharepage','share-','highlight','highlightextractor'],
 'generation':['aigentab'],
 'ai':['autoe','scriptview','creationreview','creation-review'],
 }
 for domain,keys in groups.items():
  if any(stem.startswith(k) for k in keys):return domain
 return None
for p in paths:
 if not p.startswith(web):continue
 rel=p[len(web):]; dest=None
 if rel.startswith('motion/'):dest='features/motion/'+rel[len('motion/'):]
 elif rel.startswith('desktop/'):dest='app/'+rel
 elif rel.startswith('components/audio-mixer/'):dest='features/audio/components/mixer/'+rel.split('components/audio-mixer/',1)[1]
 elif rel.startswith('components/welcome/'):dest='features/projects/components/welcome/'+rel.split('components/welcome/',1)[1]
 elif rel.startswith('components/shaders/'):dest='features/effects/components/shaders/'+rel.split('components/shaders/',1)[1]
 elif rel.startswith('components/astryx/'):dest='shared/'+rel
 elif rel.startswith('components/editor/timeline/'):dest='features/timeline/components/'+rel.split('components/editor/timeline/',1)[1]
 elif rel.startswith('components/editor/preview/'):dest='features/playback/components/'+rel.split('components/editor/preview/',1)[1]
 elif rel.startswith('components/editor/chat/'):dest='features/ai/components/chat/'+rel.split('components/editor/chat/',1)[1]
 elif rel.startswith('components/editor/kieai/'):dest='features/generation/components/'+rel.split('components/editor/kieai/',1)[1]
 elif rel.startswith('components/editor/tour/'):dest='features/onboarding/components/'+rel.split('components/editor/tour/',1)[1]
 elif rel.startswith('components/editor/inspector/'):
  tail=rel.split('components/editor/inspector/',1)[1]
  domain=feature_for(tail) if '/' not in tail else None
  dest='features/'+(domain or 'inspector')+'/components/'+tail
 elif rel.startswith('components/editor/'):
  tail=rel.split('components/editor/',1)[1];domain=feature_for(tail)
  if tail.startswith('settings/'):
   base=Path(tail).name
   domain='ai' if base.startswith(('AI','ApiKeys','Mcp','MasterPassword')) else 'settings'
  dest='features/'+(domain or 'editor-shell')+'/components/'+tail
 elif rel.startswith('components/'):dest='shared/'+rel
 elif rel.startswith('services/agent/'):dest='features/ai/'+rel
 elif rel.startswith('services/kieai/'):dest='features/generation/'+rel
 elif rel.startswith('services/'):
  domain=feature_for(rel)
  if Path(rel).name.startswith(('api-proxy','secure-storage')):dest='shared/'+rel
  elif Path(rel).name.startswith(('keyboard-shortcuts','service-worker')):dest='app/'+rel
  else:dest='features/'+(domain or 'media')+'/'+rel
 elif rel.startswith('bridges/'):
  if rel=='bridges/index.ts':dest='app/engine-bridges.ts'
  else:dest='features/'+(feature_for(rel) or 'effects')+'/'+rel
 elif rel.startswith('stores/'):
  tail=rel[len('stores/'):];base=Path(tail).name
  if tail.startswith('project/') or base.startswith('project-store'):domain='projects'
  elif base.startswith(('ai-connection','chat-')):domain='ai'
  elif base.startswith('kieai'):domain='generation'
  elif base.startswith('preview-proxy'):domain='playback'
  elif base.startswith('timeline'):domain='timeline'
  elif base.startswith('tts'):domain='audio'
  elif base.startswith('recorder'):domain='media'
  elif base.startswith('inspector-navigation'):domain='inspector'
  else:domain=None
  dest=('features/'+domain+'/state/' if domain else 'app/state/')+tail
 elif rel.startswith('utils/'):
  domain=feature_for(rel)
  dest=('features/'+domain+'/' if domain else 'shared/')+rel
 elif rel.startswith('hooks/'):
  base=Path(rel).name
  domain='projects' if base.startswith(('useProjectFonts','useProjectRecovery')) else 'generation' if base.startswith('useKieAI') else None
  dest=('features/'+domain+'/' if domain else 'app/')+rel
 elif rel.startswith('workers/'):
  domain='multicam' if 'multicam' in rel else 'captions';dest='features/'+domain+'/'+rel
 elif rel.startswith('pages/'):dest='features/'+(feature_for(rel) or 'sharing')+'/'+rel
 elif rel.startswith(('types/','icons/','config/')):dest='shared/'+rel
 if dest and dest!=rel:moves[p]=web+dest
for old,new in {
 'scripts/check_media.py':'scripts/media/check_media.py',
 'scripts/check_edit_content.py':'scripts/media/check_edit_content.py',
 'scripts/generate_fixtures.py':'scripts/media/generate_fixtures.py',
 'scripts/verify_repository_preservation.py':'scripts/repository/verify_repository_preservation.py',
 'scripts/audit_repository.py':'scripts/repository/audit_repository.py',
 'editor/apps/studio/src/components/effect/EffectEditor.tsx':'AnalyseFuture/duplicate-implementations/studio/editor/apps/studio/src/components/effect/EffectEditor.tsx',
 'editor/apps/studio/src/components/effect/FireScene.tsx':'AnalyseFuture/duplicate-implementations/studio/editor/apps/studio/src/components/effect/FireScene.tsx',
}.items():moves[old]=new
assert len(set(moves.values()))==len(moves)
for old,new in moves.items():
 assert (root/old).is_file(),old
 assert not (root/new).exists(),new
out=Path('/workspace/recovery-baseline/functional-moves.json');out.write_text(json.dumps(moves,indent=2)+'\n')
print('Planned functional file moves:',len(moves))
from collections import Counter
print(Counter(p.split('/features/')[1].split('/')[0] if '/features/' in p else 'app/shared/tools/prototype' for p in moves.values()))
