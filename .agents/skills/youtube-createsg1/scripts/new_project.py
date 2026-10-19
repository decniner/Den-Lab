"""Copy the painterly drawing reference pipeline to a fresh project."""
from pathlib import Path
import argparse,shutil
def create_project(destination):
    target=Path(destination).resolve(); source=Path(__file__).resolve().parents[1]/'assets/pipeline'
    if target.exists() and (not target.is_dir() or any(target.iterdir())):
        raise ValueError(f'Destination must be new or empty: {target}')
    shutil.copytree(source,target,dirs_exist_ok=True)
    print(f'Created sample pipeline at {target}')
    print('Adapt the narration and paintings, inspect a five-second prototype, then generate audio and finish.')
    return target
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__); p.add_argument('project_directory'); args=p.parse_args()
    try: create_project(args.project_directory)
    except ValueError as error: p.exit(2,str(error)+'\n')
