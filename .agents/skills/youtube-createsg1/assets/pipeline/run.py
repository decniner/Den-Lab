"""Reproducible stage launcher for the painterly whiteboard project."""
from config import ROOT,VOICE_PYTHON
import subprocess,sys,argparse
def renderer(script,*args): subprocess.run([sys.executable,str(ROOT/script),*args],check=True)
def voice(script,*args):
    code=f"import sys,runpy; sys.path.insert(0,{str(ROOT)!r}); sys.argv={[script,*args]!r}; runpy.run_path({str(ROOT/script)!r},run_name='__main__')"
    subprocess.run([VOICE_PYTHON,'-c',code],check=True)
p=argparse.ArgumentParser(); p.add_argument('stage',choices=['artwork','prototype','narration','finish','verify']); args=p.parse_args()
if args.stage=='artwork': renderer('prepare_artwork.py')
elif args.stage=='prototype': renderer('render.py','prototype')
elif args.stage=='narration': voice('generate_narration.py','1.08')
elif args.stage=='finish':
    renderer('timing.py'); voice('mix_audio.py'); renderer('render.py','full'); renderer('verify.py')
else: renderer('verify.py')
