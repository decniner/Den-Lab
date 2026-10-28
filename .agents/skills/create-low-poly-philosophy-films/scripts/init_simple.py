"""Initialize the approved simple-dialogue preset without copying models or secrets."""
import argparse,json,shutil
from pathlib import Path

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--project',type=Path,required=True);ap.add_argument('--reuse-tts-from',type=Path);args=ap.parse_args()
 skill=Path(__file__).resolve().parent.parent;project=args.project.resolve();template=skill/'assets/simple-conversation'
 if project.exists() and any(project.iterdir()):raise SystemExit('Use a new or empty project folder; existing work is never overwritten.')
 if args.reuse_tts_from:
  source=args.reuse_tts_from.resolve()
  if not (source/'tts/model').is_dir() or not (source/'tts/references').is_dir():raise SystemExit('The reuse source needs an existing tts/model and tts/references folder.')
 project.mkdir(parents=True,exist_ok=True);scripts=project/'pipeline/scripts';assets=project/'pipeline/assets'
 shutil.copytree(skill/'scripts',scripts,ignore=shutil.ignore_patterns('__pycache__'))
 shutil.copytree(skill/'assets',assets,ignore=shutil.ignore_patterns('simple-conversation'))
 for name in ['film.json','dialogue.json','storyboard.json']:shutil.copy2(template/name,project/name)
 for name in ['render_film.py','story_visuals.py']:shutil.copy2(template/name,scripts/name)
 cfg=json.loads((project/'film.json').read_text())
 if not Path(cfg['sans_font']).is_file():
  cfg['sans_font']='/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf';cfg['serif_font']='/usr/share/fonts/opentype/urw-base35/P052-Roman.otf'
 (project/'film.json').write_text(json.dumps(cfg,indent=2)+'\n')
 if args.reuse_tts_from:
  (project/'tts').symlink_to(source/'tts',target_is_directory=True)
  if (source/'alignment').is_dir():(project/'alignment').symlink_to(source/'alignment',target_is_directory=True)
 print('Initialized:',project)
if __name__=='__main__':main()
