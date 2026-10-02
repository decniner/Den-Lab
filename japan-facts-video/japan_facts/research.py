"""Reviewed fact research: web pages are evidence data, never instructions."""
import datetime as dt
import hashlib
import html.parser
import json
import re
import time
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from .core import Failure, Store, canonical, now

CATEGORIES=('engineering','infrastructure','geography','nature','language','everyday-life','food-science','history')
CRITERIA={'surprise':.30,'explanatory_value':.30,'source_quality':.25,'visual_potential':.15}

def normalize(value): return ' '.join(value.split())
def read(path):
    try: return json.loads(Path(path).read_text(encoding='utf-8-sig'))
    except (OSError,ValueError) as exc: raise Failure(f'Missing or malformed JSON: {path}') from exc
def write(path,data):
    path=Path(path); path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix(path.suffix+'.tmp'); tmp.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf-8'); tmp.replace(path)
def review_hash(pack):
    return hashlib.sha256(canonical({k:v for k,v in pack.items() if k!='review'})).hexdigest()
def check_providers(config):
    expected={'research_provider':'reviewed-catalog','script_provider':'reviewed-template','tts_provider':'windows-sapi'}
    for key,value in expected.items():
        if key=='research_provider' and config.get(key,value)=='reviewed-snapshot': continue
        if config.get(key,value)!=value:
            raise Failure(f'Unsupported or paid {key}. No job started; configure the documented local provider.')

class Parser(html.parser.HTMLParser):
    def __init__(self): super().__init__(); self.hidden=0; self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style','noscript'): self.hidden+=1
    def handle_endtag(self,tag):
        if tag in ('script','style','noscript'): self.hidden=max(0,self.hidden-1)
    def handle_data(self,data):
        if not self.hidden: self.parts.append(data)

def fetch(url):
    parsed=urlparse(url)
    if parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password:
        raise Failure('Sources require public HTTPS URLs without credentials.')
    for attempt in range(3):
        try:
            with urlopen(Request(url,headers={'User-Agent':'JapanExplained/1.0 editorial verification'}),timeout=20) as response:
                final=urlparse(response.url)
                if final.scheme!='https' or final.hostname!=parsed.hostname: raise Failure('Source redirected to a different host; review its canonical URL.')
                raw=response.read(2_000_001)
                if len(raw)>2_000_000: raise Failure('Source exceeded 2 MB evidence limit.')
                parser=Parser(); parser.feed(raw.decode('utf-8',errors='replace'))
                text=normalize(' '.join(parser.parts))
                if not text: raise Failure('Source has no readable text; choose an accessible source.')
                return text
        except Failure: raise
        except (OSError,TimeoutError) as exc:
            if attempt==2: raise Failure('Source provider failed after 3 attempts (20-second request timeout).') from exc
            time.sleep(2**attempt)

def verify_pack(pack,texts,at=None,max_days=30):
    at=at or now()
    try:
        review=pack['review']; reviewed=dt.datetime.fromisoformat(review['reviewed_at'].replace('Z','+00:00'))
        if not review.get('reviewed_by') or reviewed.tzinfo is None or not dt.timedelta(minutes=-5)<=at-reviewed<=dt.timedelta(days=max_days):
            raise Failure('Fact review is missing, expired or future-dated; renew its factual review.')
        if review['content_sha256']!=review_hash(pack): raise Failure('Fact/script changed since review; factual approval checksum differs.')
        if pack.get('fixture') and not pack.get('fixture_only'): raise Failure('Malformed fixture label.')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]{2,79}',pack['semantic_key']) or pack['category'] not in CATEGORIES:
            raise Failure('Canonical fact identity/category is invalid.')
        sources=pack['sources']; byid={s['id']:s for s in sources}
        if len(byid)!=len(sources) or len({s['url'] for s in sources})!=len(sources): raise Failure('Duplicate source IDs or URLs.')
        groups={s['independence_group'] for s in sources}
        if len(groups)<2 or not all(groups) or not any(s.get('authoritative') is True for s in sources):
            raise Failure('Need at least two independent publishers and an authoritative/specialist source.')
        for source in sources:
            u=urlparse(source['url'])
            if u.scheme!='https' or not u.hostname or not source.get('publisher'): raise Failure('Source provenance or HTTPS URL missing.')
        claims=pack['claims']; ids={c['id'] for c in claims}
        if not claims or len(ids)!=len(claims): raise Failure('Claim IDs must be present and unique.')
        used=set()
        for claim in claims:
            if not claim.get('text') or claim['status'] not in ('established','estimate','disputed','folklore') or not claim.get('evidence'):
                raise Failure('Unverified claim: text, classification and supporting evidence required.')
            if claim['status']!='established' and not claim.get('qualification'): raise Failure('Estimates, disputes and folklore require explicit qualification.')
            for evidence in claim['evidence']:
                sid=evidence['source']
                if 'quote_ref' in evidence:
                    quotes={q['id']:q['quote'] for q in byid[sid]['excerpts']}
                    quote=normalize(quotes[evidence['quote_ref']])
                else: quote=normalize(evidence['quote'])
                if sid not in byid or len(quote)<12 or quote not in normalize(texts[sid]): raise Failure('Unsupported claim: evidence is missing from its retrieved source.')
                used.add(sid)
        if len({byid[s]['independence_group'] for s in used})<2: raise Failure('Independent sources must actually support the spoken claims.')
        script=pack['script']
        if not script.get('title') or not script.get('segments'): raise Failure('Reviewed original script required.')
        for segment in script['segments']:
            if not segment.get('text') or not segment.get('claim_ids') or not set(segment['claim_ids'])<=ids:
                raise Failure('Every spoken segment must map to verified claim IDs.')
        return pack
    except Failure: raise
    except (KeyError,ValueError,TypeError,AttributeError) as exc: raise Failure('Malformed fact pack or evidence response.') from exc

def rank_candidates(candidates):
    if not isinstance(candidates,list) or len(candidates)<10: raise Failure('Research requires at least ten candidate topics.')
    ranked=[]; keys=set()
    for item in candidates:
        try:
            if item['semantic_key'] in keys or item['category'] not in CATEGORIES: raise ValueError()
            keys.add(item['semantic_key'])
            scores=item['scores']
            if any(type(scores[k]) not in (int,float) or not 1<=scores[k]<=5 for k in CRITERIA): raise ValueError()
            ranked.append(dict(item,score=round(sum(scores[k]*weight for k,weight in CRITERIA.items()),3)))
        except (KeyError,TypeError,ValueError): raise Failure('Invalid or duplicate candidate identity, category or 1-5 ranking scores.')
    return sorted(ranked,key=lambda c:(-c['score'],c['fact_id']))

def fingerprint(pack):
    claims=sorted(normalize(c['text']).casefold() for c in pack['claims'])
    return hashlib.sha256(canonical(claims)).hexdigest()
def repeated(item,entries,edition=None):
    names={item['fact_id'],*item.get('aliases',[])}
    for e in entries:
        if e['edition']==edition: continue
        if item['semantic_key']==e['semantic_key'] or names & {e['fact_id'],*e.get('aliases',[])}: return True
        if item.get('claims') and fingerprint(item)==e.get('claim_fingerprint'): return True
    return False
def choose(ranked,entries,edition):
    available=[c for c in ranked if not repeated(c,entries,edition)]
    if not available: raise Failure('All candidate facts are already reserved/covered. Add newly reviewed facts; do not retitle old facts.')
    last=entries[-1]['category'] if entries else None
    start=(CATEGORIES.index(last)+1)%len(CATEGORIES) if last in CATEGORIES else 0
    for offset in range(len(CATEGORIES)):
        category=CATEGORIES[(start+offset)%len(CATEGORIES)]
        choices=[c for c in available if c['category']==category]
        if choices: return choices[0]
    raise Failure('No eligible category.')
def history(root,seed=None):
    path=Path(root)/'topic-history'/'history.json'
    if path.exists(): return read(path)
    return read(seed) if seed and Path(seed).exists() else []
def reserve(root,pack,edition,seed=None):
    lock=Store(root,'topic-history')
    with lock.lock():
        entries=history(root,seed)
        existing=next((e for e in entries if e['edition']==edition),None)
        if existing:
            if existing['semantic_key']!=pack['semantic_key'] or existing['claim_fingerprint']!=fingerprint(pack): raise Failure('Edition already reserves a different fact.')
            return
        if repeated(pack,entries): raise Failure('Repeated underlying fact (canonical key, alias, or claim fingerprint).')
        entries.append({'edition':edition,'fact_id':pack['fact_id'],'semantic_key':pack['semantic_key'],'aliases':pack.get('aliases',[]),
                        'claim_fingerprint':fingerprint(pack),'category':pack['category'],'status':'reserved','at':now().isoformat()})
        write(lock.path/'history.json',entries)

def snapshot_texts(snapshot,pack,at=None):
    at=at or now()
    try:
        captured=dt.datetime.fromisoformat(snapshot['captured_at'])
        if snapshot.get('mode')!='live' or snapshot.get('fixture_only') or not snapshot.get('retrieval_method') or not snapshot.get('reviewed_by') or captured.tzinfo is None or not dt.timedelta(minutes=-5)<=at-captured<=dt.timedelta(days=1):
            raise Failure('Source snapshot must be live, attributed and captured within 24 hours; fixtures are blocked.')
        pages={p['source']:p for p in snapshot['pages']}
        texts={}
        for source in pack['sources']:
            page=pages[source['id']]
            if page['url']!=source['url'] or hashlib.sha256(page['text'].encode()).hexdigest()!=page['content_sha256']:
                raise Failure('Source snapshot URL/content checksum differs from its source manifest.')
            texts[source['id']]=page['text']
        return texts
    except Failure: raise
    except (KeyError,ValueError,TypeError,AttributeError) as exc: raise Failure('Missing or malformed attributed source snapshot.') from exc

def research_edition(store,config):
    check_providers(config)
    if (store.path/'edition.json').exists(): raise Failure('Edition already exists; inspect or resume its next stage.')
    catalog=read(config.get('catalog','facts/catalog.json'))
    ranked=rank_candidates(catalog['candidates'])
    seed=config.get('history_seed')
    # Selection and reservation share a global lock across editions.
    gate=Store(store.path.parent,'research-selection')
    with gate.lock():
        selected=choose(ranked,history(store.path.parent,seed),store.edition)
        pack_path=Path(config.get('catalog','facts/catalog.json')).parent/selected.get('pack',f"{selected['fact_id']}.json")
        if not pack_path.is_file(): raise Failure(f"Selected topic {selected['fact_id']} needs a reviewed fact pack at {pack_path}. No script/render/upload attempted.")
        pack=read(pack_path)
        if pack.get('fixture_only') or pack.get('fixture'): raise Failure('Fixtures cannot be used as live research.')
        if any(pack[k]!=selected[k] for k in ('fact_id','semantic_key','category')): raise Failure('Fact pack identity differs from candidate registry.')
        provider=config.get('research_provider','reviewed-catalog')
        if provider=='reviewed-snapshot':
            snapshot=read(config['source_snapshot']); texts=snapshot_texts(snapshot,pack)
        else: texts={s['id']:fetch(s['url']) for s in pack['sources']}
        verify_pack(pack,texts,max_days=config.get('review_max_age_days',30))
        reserve(store.path.parent,pack,store.edition,seed)
        evidence={'mode':'live','checked_at':now().isoformat(),'retrieval_provider':provider,
                  'retrieval_method':snapshot['retrieval_method'] if provider=='reviewed-snapshot' else 'direct HTTPS fetch',
                  'fact_id':pack['fact_id'],'semantic_key':pack['semantic_key'],
                  'sources':[dict(s,content_sha256=hashlib.sha256(texts[s['id']].encode()).hexdigest()) for s in pack['sources']],
                  'claims':pack['claims'],'review':pack['review'],'support_check':'retrieved quotations matched; interpretation reviewed by named reviewer'}
        write(store.path/'candidates.json',{'criteria':CRITERIA,'ranked':ranked,'selected':selected})
        write(store.path/'claims-to-sources.json',evidence); write(store.path/'fact-pack.json',pack)
        state={'edition':store.edition,'mode':'live','stage':'researched','fact_id':pack['fact_id'],'created_at':now().isoformat(),
               'research_sha256':hashlib.sha256(canonical(evidence)).hexdigest(),'pack_sha256':review_hash(pack)}
        store.save(state); return state
