"""Fetch the pinned official assets with TLS and content verification."""
import json,os,ssl,urllib.request
from pathlib import Path
from common import load_project
from narration import file_digest
HERE=Path(__file__).resolve().parent

def prepare(root):
    cfg,_=load_project(root)
    manifest=json.loads((HERE.parent/'assets/chatterbox_manifest.json').read_text())
    model=root/Path(cfg.get('chatterbox_model_dir','tts/model'))
    refs=root/'tts/references'
    ctx=ssl.create_default_context()
    for key in ('SSL_CERT_FILE','REQUESTS_CA_BUNDLE'):
        value=os.environ.get(key)
        if value and Path(value).is_file():ctx.load_verify_locations(value)
    assets=[(model/name,digest,f'https://huggingface.co/ResembleAI/chatterbox-turbo/resolve/{manifest["revision"]}/{name}') for name,digest in manifest['files'].items()]
    assets += [(refs/name,digest,f'https://huggingface.co/kyutai/tts-voices/resolve/main/voice-zero/{name}') for name,digest in manifest['voices'].items()]
    for path,digest,url in assets:
        if path.is_file() and file_digest(path)==digest:continue
        path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_suffix(path.suffix+'.partial')
        with urllib.request.urlopen(url,context=ctx,timeout=60) as response,temp.open('wb') as out:
            while chunk:=response.read(1024*1024):out.write(chunk)
        if file_digest(temp)!=digest:
            temp.unlink();raise ValueError(f'Asset checksum mismatch: {path.name}')
        temp.replace(path)
        print(f'Asset ready: {path.name}',flush=True)
    return model,refs,manifest

if __name__=='__main__':
    model,refs,_=prepare(Path(os.environ['PHILOSOPHY_FILM_PROJECT']).resolve())
    print('Verified Chatterbox model and CC0 references',flush=True)
