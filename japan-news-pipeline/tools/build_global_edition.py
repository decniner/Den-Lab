"""Prepare the operator-authorized October 3 global edition locally."""
import datetime as dt
import json
import shutil
from pathlib import Path
from build_philippine_edition import COMPOSITION

ROOT=Path(__file__).resolve().parent.parent
TARGET=ROOT/'deliverables'/'global-news-20261003'

CARDS=r'''    a,b=6,25
    text(a,b,"01 / HORN OF AFRICA",80,290,27,"FC555D")
    text(a,b,"DIPLOMATIC\nTIES SEVERED",80,375,72)
    text(a,b,"ETHIOPIA / ERITREA",120,650,30,"A6B9CE",False)
    text(a,b,"EMBASSY\nCLOSURE",120,760,76,"FC555D")
    text(a,b,"10 Eritrean diplomats told to leave",120,1000,31)
    text(a,b,"48-hour deadline / Reuters report",120,1110,29,"A6B9CE",False)
    text(a,b,"SOURCE: REUTERS VIA SIGHT / OCT 2",80,1250,25,"A6B9CE",False)
    a,b=25,49
    text(a,b,"02 / EUROPEAN CLIMATE",80,290,27,"4CDCC7")
    text(a,b,"WESTERN EUROPE\nRECORD SUMMER",80,375,62)
    text(a,b,"COPERNICUS SUMMER REVIEW",120,650,27,"A6B9CE",False)
    text(a,b,"WARMEST\nON RECORD",120,765,70,"4CDCC7")
    text(a,b,"Western Europe / summer 2026",120,985,29)
    text(a,b,"Europe overall: third-warmest summer",120,1090,26,"A6B9CE",False)
    text(a,b,"SOURCE: COPERNICUS / REUTERS / OCT 2",80,1250,24,"A6B9CE",False)
    a,b=49,75
    text(a,b,"03 / INTERNATIONAL SPACE STATION",80,290,25,"FFD166")
    text(a,b,"CREW-13\nARRIVES AT ISS",80,375,72)
    text(a,b,"NASA / CANADA / RUSSIA",120,650,29,"A6B9CE",False)
    text(a,b,"7 h 55 m",120,785,95,"FFD166")
    text(a,b,"Launch to docking / NASA report",120,935,30)
    text(a,b,"Fastest U.S. spacecraft ISS docking trip",120,1040,25)
    text(a,b,"Docked October 1 / Eastern time",120,1130,26,"A6B9CE",False)
    text(a,b,"SOURCE: NASA / OCT 1 EDT",80,1250,25,"A6B9CE",False)
'''

def main():
    if TARGET.exists(): raise RuntimeError('Edition exists; do not overwrite')
    TARGET.mkdir(parents=True)
    segments=[
        ('intro',None,'Global news in eighty seconds. Three verified updates, checked October third.'),
        ('africa','reuters-africa','First, Eritrea has severed diplomatic ties with Ethiopia after Ethiopia ordered its embassy in Asmara closed.'),
        ('africa','reuters-africa','Reuters reports that Ethiopia also told ten Eritrean diplomats to leave within forty eight hours.'),
        ('africa','reuters-africa','The moves come amid renewed fighting in northern Ethiopia.'),
        ('climate','copernicus-review','Second, western Europe recorded its hottest summer, according to a new Copernicus review released October second.'),
        ('climate','copernicus-review','Europe as a whole had its third warmest summer.'),
        ('climate','reuters-climate','Reuters reports that fifty two percent of the continent had faced very strong heat stress by the end of summer.'),
        ('climate','reuters-climate','That figure describes affected land, rather than a count of people harmed.'),
        ('space','nasa-docking','Third, four astronauts have reached the International Space Station aboard SpaceX\'s Crew Thirteen mission.'),
        ('space','nasa-docking','NASA confirms Dragon docked on October first, Eastern time, after a flight lasting seven hours and fifty five minutes.'),
        ('space','nasa-docking','The agency calls it the fastest launch to docking by a United States spacecraft in the station\'s history.'),
        ('space','nasa-docking','The crew includes astronauts from NASA, Canada, and Russia.'),
        ('outro',None,'Read the original source links in the description for more details.')]
    script={'edition':'global-news-20261003-en','mode':'live-news','language':'en',
            'source_checked_at':dt.datetime.now(dt.timezone.utc).isoformat(),'public_approval':'not requested',
            'segments':[dict(story=story,text=text,**({'source':source} if source else {})) for story,source,text in segments]}
    sources={'fixture':False,'checked_by':'assistant web factual review; operator authorized private upload','sources':[
        {'id':'reuters-africa','url':'https://sightmagazine.com.au/news/eritrea-severs-diplomatic-ties-with-ethiopia-after-addis-ababa-orders-closure-of-embassy-in-asmara/','published_at':'2026-10-02T09:00:00+10:00'},
        {'id':'copernicus-review','url':'https://climate.copernicus.eu/c3s-summer-review-2026-out','published_at':'2026-10-02T00:00:00+02:00'},
        {'id':'reuters-climate','url':'https://www.aol.co.uk/articles/half-europe-faced-very-strong-021105000.html','published_at':'2026-10-02T02:15:00+00:00'},
        {'id':'nasa-docking','url':'https://www.nasa.gov/blogs/spacestation/2026/10/01/dragon-docks-bringing-spacex-crew-13-to-station/','published_at':'2026-10-01T19:13:00-04:00'}]}
    for name,data in [('script.json',script),('sources.json',sources)]: (TARGET/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    old=ROOT/'deliverables'/'philippine-news-20261003'
    shutil.copyfile(old/'narrate.ps1',TARGET/'narrate.ps1')
    composition=COMPOSITION.replace('PHILIPPINES TODAY','GLOBAL TODAY').replace('PHILIPPINES\\nIN 80 SECONDS','THE WORLD\\nIN 80 SECONDS').replace('REPORTS FROM OCT 2','REPORTS FROM OCT 1-2')
    composition=composition.replace('GCASH IPO','AFRICA DIPLOMACY').replace('CLIMATE READINESS','EUROPEAN CLIMATE').replace('ASIAN GAMES GOLD','SPACE STATION')
    start=composition.index('    a,b=6,25'); stop=composition.index('    a,b=75,80',start)
    composition=composition[:start]+CARDS+composition[stop:]
    composition=composition.replace('("GMA NEWS","Mynt IPO pricing / October 2",620','("REUTERS VIA SIGHT","Diplomatic ties / October 2",620')
    composition=composition.replace('("PHILIPPINE INFORMATION AGENCY","CCC preparedness / October 2",850','("COPERNICUS / REUTERS","Summer review / October 2",850')
    composition=composition.replace('("OLYMPIC COUNCIL OF ASIA","Yape\'s gold medal / October 2",1080','("NASA","Crew-13 docking / October 1 EDT",1080')
    renderer=(old/'render.py').read_text(encoding='utf-8')
    start=renderer.index('def composition('); stop=renderer.index('def validate(',start)
    renderer=renderer[:start]+composition+renderer[stop:]
    renderer=renderer.replace('"business": (6, 25)','"africa": (6, 25)').replace('"sport": (49, 75)','"space": (49, 75)')
    renderer=renderer.replace('philippine-news-20261003-en','global-news-20261003-en').replace('philippine-news-80s-tiktok.mp4','global-news-80s-tiktok.mp4').replace('Philippine News in 80 Seconds','Global News in 80 Seconds')
    (TARGET/'render.py').write_text(renderer,encoding='utf-8')
    notes='# Global news edition, October 3, 2026\n\nChecked October 3 JST; reports from October 1-2. Original graphics and local synthetic narration.\n\n'
    notes+='Diplomacy: Reuters confirms embassy closure, ten diplomats and a 48-hour deadline; unverified attack claims omitted.\nClimate: Copernicus review confirms Western Europe warmest, Europe third-warmest. Reuters heat-stress figure is geographical exposure by summer end, not population or simultaneous exposure.\nSpace: NASA confirms Oct 1 7:05pm EDT docking and 7h55m flight. Record is U.S. spacecraft trips to ISS, not all spacecraft worldwide. Four crew from NASA/CSA/Roscosmos; no contradictory aggregator crew names used.\n\n'
    notes+='\n'.join('- '+s['url'] for s in sources['sources'])+'\n'
    (TARGET/'source-notes.md').write_text(notes,encoding='utf-8')
    print('Global source-backed edition prepared; speech/render/upload not yet performed.')

if __name__=='__main__': main()
