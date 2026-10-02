"""Read-only check of the configured OAuth destination; never prints credentials."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from japan_facts.research import read
from japan_facts.youtube import API
from japan_facts.core import Failure, log

if __name__=='__main__':
    try:
        config=read('config.json'); API(config['oauth_token']).check_channel(config['channel_id'])
        log('destination_channel_verified',channel_id=config['channel_id'],upload='not attempted')
    except (Failure,OSError,ValueError,KeyError) as exc:
        log('destination_channel_failure',error=str(exc)); raise SystemExit(1)
