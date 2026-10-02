"""Prepare the source-checked October 3 AI edition without paid services."""
import datetime as dt
import json
import shutil
from pathlib import Path
from build_philippine_edition import COMPOSITION

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / 'deliverables' / 'ai-news-20261003'
CARDS = r'''    a,b=6,25
    text(a,b,"01 / IMAGE GENERATION",80,290,27,"FC555D")
    text(a,b,"FLUX 3 IMAGE\nNEW CONTROLS",80,375,68)
    text(a,b,"BLACK FOREST LABS",120,650,29,"A6B9CE",False)
    text(a,b,"4K\nTARGETED EDITS",120,755,65,"FC555D")
    text(a,b,"Bounding boxes for image composition",120,1020,28)
    text(a,b,"Capabilities described by the vendor",120,1120,27,"A6B9CE",False)
    text(a,b,"SOURCE: BLACK FOREST LABS / OCT 1",80,1250,25,"A6B9CE",False)
    a,b=25,49
    text(a,b,"02 / LOCAL AI",80,290,27,"4CDCC7")
    text(a,b,"STRANDS\nDECIDER 2B",80,375,72)
    text(a,b,"A SMALL DECISION MODEL",120,650,28,"A6B9CE",False)
    text(a,b,"2 BILLION\nPARAMETERS",120,755,65,"4CDCC7")
    text(a,b,"Selects options / assigns scores",120,1020,31)
    text(a,b,"Runs locally / CPU or GPU",120,1120,30,"A6B9CE",False)
    text(a,b,"SOURCE: STRANDS AGENTS / OCT 1",80,1250,25,"A6B9CE",False)
    a,b=49,75
    text(a,b,"03 / U.S. AI POLICY",80,290,27,"FFD166")
    text(a,b,"AI AGENT\nACCOUNTABILITY",80,375,65)
    text(a,b,"HAWLEY / MURPHY PROPOSAL",120,650,28,"A6B9CE",False)
    text(a,b,"HACKING\nSAFEGUARDS",120,755,69,"FFD166")
    text(a,b,"Operator and developer liability",120,1020,30)
    text(a,b,"Proposed legislation / not enacted",120,1120,28,"A6B9CE",False)
    text(a,b,"SOURCE: SENATOR HAWLEY / OCT 1",80,1250,25,"A6B9CE",False)
'''

def main():
    if TARGET.exists(): raise RuntimeError('Edition exists; do not overwrite')
    TARGET.mkdir(parents=True)
    segments = [
        ('intro',None,'AI news in eighty seconds. Three verified updates, checked October third.'),
        ('image','bfl-image','First, Black Forest Labs has released Flux Three Image.'),
        ('image','bfl-image','The company describes images up to four K, targeted edits, and bounding boxes for placing objects.'),
        ('image','bfl-image','Its demonstrations show changing part of a picture while preserving the rest. These are vendor claims.'),
        ('decisions','strands-decider','Second, the Strands team has released Decider Two B, a small decision model with two billion parameters.'),
        ('decisions','strands-decider','The official announcement says it can run locally on a processor or graphics card.'),
        ('decisions','strands-decider','It chooses from supplied options or assigns scores, rather than writing free form text.'),
        ('decisions','strands-decider','Code, weights, and training materials are available.'),
        ('policy','hawley-proposal','Third, U S Senators Josh Hawley and Chris Murphy announced the AI Agent Accountability Act.'),
        ('policy','hawley-proposal','The proposal would hold operators and developers responsible for certain hacking damage caused by AI agents.'),
        ('policy','hawley-proposal','The sponsors say developers could face liability for failing to add reasonable safeguards when they know of hacking capabilities.'),
        ('policy','hawley-proposal','This is proposed legislation, not an enacted law.'),
        ('outro',None,'Read the original source links in the description for more details.')]
    script = {'edition':'ai-news-20261003-en','mode':'live-news','language':'en',
              'source_checked_at':dt.datetime.now(dt.timezone.utc).isoformat(),'public_approval':'not requested',
              'segments':[dict(story=story,text=text,**({'source':source} if source else {})) for story,source,text in segments]}
    sources = {'fixture':False,'checked_by':'assistant primary-source review; operator authorized private upload',
               'timestamp_note':'Date-only announcements conservatively use UTC start of publication day; these are freshness bounds, not exact posting times.',
               'sources':[
        {'id':'bfl-image','url':'https://bfl.ai/models/flux-3-image','published_at':'2026-10-01T00:00:00+00:00','timestamp_precision':'date','date_evidence':'https://gigazine.net/news/20261002-flux-3-image/'},
        {'id':'strands-decider','url':'https://strandsagents.com/blog/introducing-strands-decider/','published_at':'2026-10-01T00:00:00+00:00','timestamp_precision':'date'},
        {'id':'hawley-proposal','url':'https://www.hawley.senate.gov/senators-hawley-murphy-announce-bipartisan-ai-agent-accountability-act/','published_at':'2026-10-01T00:00:00+00:00','timestamp_precision':'date'}]}
    for name,data in [('script.json',script),('sources.json',sources)]:
        (TARGET/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    old = ROOT/'deliverables'/'philippine-news-20261003'
    shutil.copyfile(old/'narrate.ps1',TARGET/'narrate.ps1')
    composition = COMPOSITION.replace('PHILIPPINES TODAY','AI TODAY').replace('PHILIPPINES\\nIN 80 SECONDS','AI NEWS\\nIN 80 SECONDS').replace('REPORTS FROM OCT 2','ANNOUNCEMENTS FROM OCT 1')
    composition = composition.replace('GCASH IPO','IMAGE GENERATION').replace('CLIMATE READINESS','LOCAL AI MODEL').replace('ASIAN GAMES GOLD','AI POLICY')
    start=composition.index('    a,b=6,25'); stop=composition.index('    a,b=75,80',start)
    composition=composition[:start]+CARDS+composition[stop:]
    composition=composition.replace('("GMA NEWS","Mynt IPO pricing / October 2",620','("BLACK FOREST LABS","FLUX 3 Image / October 1",620')
    composition=composition.replace('("PHILIPPINE INFORMATION AGENCY","CCC preparedness / October 2",850','("STRANDS AGENTS","Decider 2B / October 1",850')
    composition=composition.replace('("OLYMPIC COUNCIL OF ASIA","Yape\'s gold medal / October 2",1080','("SENATOR HAWLEY","Bipartisan AI proposal / October 1",1080')
    renderer=(old/'render.py').read_text(encoding='utf-8')
    start=renderer.index('def composition('); stop=renderer.index('def validate(',start)
    renderer=renderer[:start]+composition+renderer[stop:]
    renderer=renderer.replace('"business": (6, 25)','"image": (6, 25)').replace('"climate": (25, 49)','"decisions": (25, 49)').replace('"sport": (49, 75)','"policy": (49, 75)')
    renderer=renderer.replace('philippine-news-20261003-en','ai-news-20261003-en').replace('philippine-news-80s-tiktok.mp4','ai-news-80s-tiktok.mp4').replace('Philippine News in 80 Seconds','AI News in 80 Seconds')
    (TARGET/'render.py').write_text(renderer,encoding='utf-8')
    notes = '# AI news edition, October 3, 2026\n\nPrimary sources checked October 3 JST. Announcements dated October 1. Date-only timestamps use conservative UTC start-of-day bounds.\n\n'
    notes += 'FLUX 3 Image: BFL confirms 4K, bounding boxes, and targeted edits preserving other areas. These capabilities are explicitly vendor claims; no paid generation or independent benchmark was performed. October 1 launch date corroborated by GIGAZINE embedding the dated official BFL announcement.\n\nStrands: official October 1 post confirms two billion parameters, local CPU/GPU operation, option selection/scoring, and released code/weights/training materials. No claim that it generates text or replaces reasoning models.\n\nPolicy: official October 1 announcement describes a proposed bill, conditional operator/developer hacking liability, and reasonable safeguards. The video does not represent it as enacted law.\n\n'
    notes += '\n'.join('- '+s['url'] for s in sources['sources'])+'\n- https://gigazine.net/news/20261002-flux-3-image/\n'
    (TARGET/'source-notes.md').write_text(notes,encoding='utf-8')
    print('AI edition prepared; narration, rendering, and upload pending.')

if __name__ == '__main__': main()
