"""Copy the approved, editable paper-diorama starter into a fresh project."""
from pathlib import Path
import argparse,shutil

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('destination',type=Path);args=parser.parse_args();dest=args.destination.expanduser().resolve()
 if dest.exists():parser.error('Destination already exists; choose a new folder to preserve existing work.')
 source=Path(__file__).resolve().parents[1]/'assets'/'starter'
 dest.mkdir(parents=True);shutil.copytree(source,dest/'work',ignore=shutil.ignore_patterns('__pycache__','*.pyc'));(dest/'outputs').mkdir();print(dest);print('Edit work/project.json, scenes.json and subject-specific art.py before production.')
if __name__=='__main__':main()
