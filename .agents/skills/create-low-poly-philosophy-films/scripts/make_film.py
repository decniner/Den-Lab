import argparse,json,os,shutil,subprocess,sys
from pathlib import Path
from common import load_project,project_lock
HERE=Path(__file__).resolve().parent
def main():
    p=argparse.ArgumentParser();p.add_argument('action',choices=['init','validate','setup-voice','audio','samples','render','verify']);p.add_argument('--project',type=Path,required=True);a=p.parse_args();root=a.project.resolve()
    if a.action=='init':
        root.mkdir(parents=True,exist_ok=True)
        for f in ['film.json','dialogue.json']:
            if(root/f).exists():raise ValueError(f'Refusing to overwrite {f}')
        for f in ['film.json','dialogue.json']:shutil.copy2(HERE.parent/'assets'/f,root/f)
        print(f'Initialized {root}');return
    cfg,lines=load_project(root)
    if a.action=='validate':print(json.dumps({'valid':True,'turns':len(lines),'words':sum(len(s['text'].split()) for s in lines)}));return
    env=dict(os.environ,PHILOSOPHY_FILM_PROJECT=str(root))
    def run(name,*args):subprocess.run([sys.executable,str(HERE/name),*args],env=env,cwd=root,check=True)
    with project_lock(root):
        if a.action=='setup-voice':run('setup_chatterbox.py')
        elif a.action=='audio':
            if cfg.get('audio_engine','chatterbox')=='edge':run('prepare_audio.py')
            else:run('prepare_chatterbox.py');run('align_chatterbox.py')
        elif a.action=='samples':run('render_film.py','--preview')
        elif a.action=='render':run('render_film.py');run('verify.py')
        else:run('verify.py')
if __name__=='__main__':
    try:main()
    except (ValueError,FileExistsError) as e:sys.exit(f'Film error: {e}')
