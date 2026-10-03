"""Explicit rendition of an existing verified fact; never resets topic history."""
import shutil
from pathlib import Path
from .core import Store, Failure, check_artifacts, digest, now
from .production import check_research, create_script

def create_revision(store,parent_path,approved_parent):
    parent_path=Path(parent_path).resolve()
    if not (parent_path/'edition.json').is_file(): raise Failure('Revision parent is missing.')
    parent=Store(parent_path.parent,parent_path.name)
    if store.path==parent.path or (store.path/'edition.json').exists():
        raise Failure('Revision must use a new edition ID; existing editions are immutable.')
    with parent.lock():
        old=parent.load(); check_artifacts(old); check_research(parent,old)
        if approved_parent!=old['manifest']['video_sha256']:
            raise Failure('Revision must approve the exact parent render.')
        store.path.mkdir(parents=True,exist_ok=True)
        for name in ('fact-pack.json','claims-to-sources.json','candidates.json'):
            shutil.copyfile(parent.path/name,store.path/name)
        state={key:old[key] for key in ('mode','fact_id','research_sha256','pack_sha256')}
        state.update(edition=store.edition,stage='researched',created_at=now().isoformat(),
                     revision_of=old['edition'],parent_video_sha256=approved_parent,
                     parent_video_id=old.get('upload',{}).get('video_id'),
                     revision_reason='Owner requested Andrew narration; same verified underlying fact')
        store.save(state)
        create_script(store)
        return state
