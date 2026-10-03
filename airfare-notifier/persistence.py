"""Durable claims before Telegram delivery, isolated from existing histories."""
from __future__ import annotations
import base64
import json
import os
import re
from datetime import date
from pathlib import Path
from urllib.parse import quote


def validate(data):
    if not isinstance(data, dict) or data.get('version') != 1:
        raise RuntimeError('Invalid airfare history; refusing to reset deduplication')
    for collection in ('summaries', 'operations'):
        entries = data.get(collection)
        if not isinstance(entries, dict): raise RuntimeError('Invalid airfare history entries')
        for key, entry in entries.items():
            try:
                date.fromisoformat(key.split(':')[0])
                if entry['status'] not in ('claimed', 'sent'): raise ValueError()
            except (ValueError, TypeError, KeyError, AttributeError):
                raise RuntimeError('Invalid airfare delivery claim') from None
    return data


def empty(): return {'version': 1, 'summaries': {}, 'operations': {}}


class FileState:
    def __init__(self, path): self.path = Path(path)

    def load(self):
        try: return validate(json.loads(self.path.read_text(encoding='utf-8')))
        except FileNotFoundError: return empty()
        except (OSError, ValueError): raise RuntimeError('Cannot read airfare history; delivery stopped') from None

    def save(self, data):
        validate(data)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix('.tmp')
        with tmp.open('w', encoding='utf-8') as out:
            json.dump(data, out, ensure_ascii=False, indent=2)
            out.flush(); os.fsync(out.fileno())
        os.replace(tmp, self.path)

    def claim(self, collection, key, now):
        data = self.load()
        if key in data[collection]: return False
        data[collection][key] = {'status': 'claimed', 'at': now.isoformat()}
        self.save(data)
        return True

    def acknowledge(self, collection, key):
        data = self.load()
        data[collection][key]['status'] = 'sent'
        self.save(data)


class GitHubState(FileState):
    branch = 'airfare-notifier-state'
    remote_path = 'airfare-notifier/state.json'

    def __init__(self, repository, backup_path, api):
        super().__init__(backup_path)
        if not re.fullmatch(r'[\w.-]+/[\w.-]+', repository): raise RuntimeError('Invalid GITHUB_REPOSITORY')
        self.repository, self.api, self.sha = repository, api, None

    def load(self):
        try:
            self.api.request(f'{self.repository}/git/ref/heads/{self.branch}')
        except RuntimeError as exc:
            if str(exc) != 'GitHub HTTP 404': raise
            self.sha = None
            return empty()
        try:
            result = self.api.request(f'{self.repository}/contents/{self.remote_path}?ref={self.branch}')
            data = validate(json.loads(base64.b64decode(result['content'])))
            self.sha = result['sha']
            return data
        except RuntimeError:
            raise
        except (ValueError, KeyError, TypeError):
            raise RuntimeError('Invalid remote airfare history; delivery stopped') from None

    def save(self, data):
        # Atomic GitHub Contents API SHA comparison is the cross-run delivery gate.
        if self.sha is None:
            repo = self.api.request(self.repository)
            ref = self.api.request(f'{self.repository}/git/ref/heads/{quote(repo["default_branch"], safe="")}')
            base_sha = ref['object']['sha']
            base = self.api.request(f'{self.repository}/git/commits/{base_sha}')
            tree = self.api.request(f'{self.repository}/git/trees', method='POST',
                                    payload={'base_tree': base['tree']['sha'], 'tree': [
                                        {'path': self.remote_path, 'mode': '100644', 'type': 'blob',
                                         'content': json.dumps(validate(data), ensure_ascii=False)}]})
            commit = self.api.request(f'{self.repository}/git/commits', method='POST',
                                      payload={'message': 'Initialize airfare delivery history',
                                               'tree': tree['sha'], 'parents': [base_sha]})
            # Publish the branch only after its first durable claim exists in its tree.
            self.api.request(f'{self.repository}/git/refs', method='POST',
                             payload={'ref': f'refs/heads/{self.branch}', 'sha': commit['sha']})
            saved = self.api.request(f'{self.repository}/contents/{self.remote_path}?ref={self.branch}')
            self.sha = saved['sha']
            super().save(data)
            return
        payload = {'message': 'Persist airfare delivery claim', 'branch': self.branch,
                   'content': base64.b64encode(json.dumps(validate(data), ensure_ascii=False).encode()).decode()}
        if self.sha: payload['sha'] = self.sha
        result = self.api.request(f'{self.repository}/contents/{self.remote_path}', method='PUT', payload=payload)
        try: self.sha = result['content']['sha']
        except (KeyError, TypeError): raise RuntimeError('Airfare state write unconfirmed; delivery stopped') from None
        super().save(data)
