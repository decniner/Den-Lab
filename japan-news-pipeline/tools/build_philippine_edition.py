"""Prepare the reviewed October 3 Philippine edition; no paid services or uploads."""
import datetime as dt
import json
import shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
TARGET=ROOT/'deliverables'/'philippine-news-20261003'

COMPOSITION=r'''def composition(captions):
    events=[]
    def event(begin,end,layer,content,style="Graphic"):
        events.append(f"Dialogue: {layer},{ass_time(begin)},{ass_time(end)},{style},,0,0,0,,{content}")
    def text(begin,end,content,x,y,size=40,rgb="FFFFFF",bold=True):
        tags=f"\\an7\\pos({x},{y})\\fad(120,100)\\fs{size}\\b{int(bold)}\\1c{color(rgb)}\\bord0\\shad0"
        event(begin,end,2,"{"+tags+"}"+escape(content))
    def box(begin,end,x,y,w,h,rgb,layer=0):
        tags=f"\\an7\\pos({x},{y})\\p1\\1c{color(rgb)}\\bord0\\shad0"
        event(begin,end,layer,"{"+tags+"}"+f"m 0 0 l {w} 0 {w} {h} 0 {h}"+"{\\p0}")
    for y in range(0,1920,120): box(0,80,0,y,1080,1,"112235")
    for x in range(0,1080,120): box(0,80,x,0,1,1920,"112235")
    box(0,80,80,178,60,6,"FC555D")
    text(0,80,"PHILIPPINES TODAY",80,110,32)
    text(0,80,"03 OCT 2026 / REPORTS FROM OCT 2",80,214,24,"A6B9CE",False)
    text(0,80,"Synthetic narration / Original graphics",80,1615,23,"A6B9CE",False)
    box(0,80,80,1545,800,5,"23384F")
    text(0,6,"THREE VERIFIED UPDATES",80,320,28,"4CDCC7")
    text(0,6,"PHILIPPINES\nIN 80 SECONDS",80,420,72)
    for num,heading,y,rgb in [("01","GCASH IPO",865,"FC555D"),("02","CLIMATE READINESS",1050,"4CDCC7"),("03","ASIAN GAMES GOLD",1235,"FFD166")]:
        text(0,6,num,80,y,110,rgb); text(0,6,heading,275,y+45,32)
    for a,b in [(6,25),(25,49),(49,75)]:
        box(a,b,80,610,800,585,"102238"); box(a,b,80,610,7,585,"FC555D",1)
    a,b=6,25
    text(a,b,"01 / BUSINESS",80,290,27,"FC555D")
    text(a,b,"MYNT SETS\nIPO PRICE",80,375,72)
    text(a,b,"GCASH PARENT COMPANY",120,650,26,"A6B9CE",False)
    text(a,b,"PHP 6.60",120,780,95,"FC555D")
    text(a,b,"PER SHARE",120,910,35)
    text(a,b,"Oct 20 / planned PSE listing",120,1050,33)
    text(a,b,"Schedule remains subject to conditions",120,1130,25,"A6B9CE",False)
    text(a,b,"SOURCE: GMA NEWS / OCT 2",80,1250,25,"A6B9CE",False)
    a,b=25,49
    text(a,b,"02 / CLIMATE PREPAREDNESS",80,290,27,"4CDCC7")
    text(a,b,"PREPARE\nBEFORE IMPACTS",80,375,72)
    text(a,b,"CLIMATE CHANGE COMMISSION",120,650,26,"A6B9CE",False)
    text(a,b,"SCIENCE\nDATA\nRISK INFORMATION",120,755,54,"4CDCC7")
    text(a,b,"Possible stronger El Nino",120,1040,35)
    text(a,b,"Risk varies by area / not a local forecast",120,1130,25,"A6B9CE",False)
    text(a,b,"SOURCE: PIA / CCC RELEASE / OCT 2",80,1250,25,"A6B9CE",False)
    a,b=49,75
    text(a,b,"03 / ASIAN GAMES",80,290,27,"FFD166")
    text(a,b,"YAPE WINS\nVIRTUAL GOLD",80,375,72)
    text(a,b,"JEUS GABRIEL DERICK YAPE",120,650,27,"A6B9CE",False)
    text(a,b,"GOLD",120,785,110,"FFD166")
    text(a,b,"Mixed individual virtual taekwondo",120,930,30)
    text(a,b,"2-0 in the final / versus Vietnam",120,1020,29)
    text(a,b,"Philippines' fourth gold at these Games",120,1110,25,"A6B9CE",False)
    text(a,b,"SOURCE: OLYMPIC COUNCIL OF ASIA / OCT 2",80,1250,23,"A6B9CE",False)
    a,b=75,80
    text(a,b,"READ THE SOURCES",80,355,59)
    for heading,detail,y,rgb in [("GMA NEWS","Mynt IPO pricing / October 2",620,"FC555D"),("PHILIPPINE INFORMATION AGENCY","CCC preparedness / October 2",850,"4CDCC7"),("OLYMPIC COUNCIL OF ASIA","Yape's gold medal / October 2",1080,"FFD166")]:
        text(a,b,heading,80,y,32,rgb); text(a,b,detail,80,y+85,27,"A6B9CE",False)
    text(a,b,"Source links in the video description",80,1325,26,"A6B9CE",False)
    for caption in captions:
        lines=textwrap.wrap(caption["text"],width=25,break_long_words=False,break_on_hyphens=False)
        if len(lines)>2: raise ValueError("Caption requires more than two lines")
        event(caption["start"],caption["end"],5,"{\\fad(35,35)}"+escape("\n".join(lines)),"Caption")
    header="""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Graphic,Arial,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,7,80,180,0,1
Style: Caption,Arial,56,&H00FFFFFF,&H00FFFFFF,&H00100A05,&H00100A05,-1,0,0,0,100,100,0,0,1,4,1,2,95,190,400,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    (ROOT/"composition.ass").write_text(header+"\n".join(events)+"\n",encoding="utf-8")

'''

def main():
    if TARGET.exists(): raise RuntimeError('Edition folder already exists; do not overwrite an edition')
    TARGET.mkdir(parents=True)
    segments=[
        ('intro',None,'Philippine news in eighty seconds. Three updates, checked October third.'),
        ('business','gma-mynt','First, GCash parent company Mynt has set its initial public offering price at six pesos and sixty centavos per share.'),
        ('business','gma-mynt','GMA News reports the planned Philippine Stock Exchange listing is October twentieth.'),
        ('business','mynt-primary','The company says the timetable remains subject to approvals and other conditions.'),
        ('climate','pia-ccc','Second, the Climate Change Commission is calling for stronger preparation as El Nino could intensify before the end of this year.'),
        ('climate','pia-ccc','In an October second release carried by the Philippine Information Agency, it urged decisions guided by science, data, and risk information.'),
        ('climate','pia-ccc','The advisory highlights risks of below normal rainfall, dry spells, and drought in some areas.'),
        ('sport','oca-yape','Third, Jeus Gabriel Derick Yape won gold in mixed individual virtual taekwondo at the Asian Games in Japan.'),
        ('sport','oca-yape','The Olympic Council of Asia reports that he beat his Vietnamese opponent two rounds to zero in the final.'),
        ('sport','oca-yape','He had won a poomsae bronze the previous day.'),
        ('sport','oca-yape','This was the Philippines fourth gold medal at these Games, after two from Carlos Yulo and one from E J Obiena.'),
        ('outro',None,'Read the original source links in the description for more details.')]
    script={'edition':'philippine-news-20261003-en','mode':'live-news','language':'en','source_checked_at':dt.datetime.now(dt.timezone.utc).isoformat(),'public_approval':'not requested',
            'segments':[dict(story=story,text=text,**({'source':source} if source else {})) for story,source,text in segments]}
    sources={'fixture':False,'checked_by':'assistant web source review; exact edition requested by operator','sources':[
        {'id':'gma-mynt','url':'https://www.gmanetwork.com/news/money/companies/1004507/gcash-parent-mynt-sets-final-ipo-price-at-p6-60-per-share/story/','published_at':'2026-10-02T10:38:00+08:00'},
        {'id':'mynt-primary','url':'https://mynt.com.ph/newsroom/gcash-parent-mynt-prices-proposed-ipo-at-6-60-per-share-following-strong-institutional-demand','published_at':'2026-10-02T00:00:00+08:00'},
        {'id':'pia-ccc','url':'https://pia.gov.ph/press-release/ccc-pushes-predictive-governance-as-very-strong-el-nino-looms/','published_at':'2026-10-02T00:00:00+08:00'},
        {'id':'oca-yape','url':'https://oca.asia/news/8141-philippines-poomsae-star-wins-first-virtual-taekwondo-title-of-asian-games.html','published_at':'2026-10-02T00:00:00+09:00'}]}
    for name,data in [('script.json',script),('sources.json',sources)]: (TARGET/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    old=ROOT/'deliverables'/'japan-news-20261002'
    shutil.copyfile(old/'narrate.ps1',TARGET/'narrate.ps1')
    renderer=(old/'render.py').read_text(encoding='utf-8')
    start=renderer.index('def composition('); stop=renderer.index('def validate(',start)
    renderer=renderer[:start]+COMPOSITION+renderer[stop:]
    renderer=renderer.replace('"drone": (6, 25), "policy": (25, 49), "tankan": (49, 75)','"business": (6, 25), "climate": (25, 49), "sport": (49, 75)')
    renderer=renderer.replace('japan-news-20261002-en','philippine-news-20261003-en').replace('japan-news-80s-tiktok.mp4','philippine-news-80s-tiktok.mp4')
    renderer=renderer.replace('"paid_jobs":0}', '"paid_jobs":0,"video_file":"philippine-news-80s-tiktok.mp4","title":"Philippine News in 80 Seconds | 2026-10-03",\n            "script_sha256":hashlib.sha256((ROOT/"script.json").read_bytes()).hexdigest(),\n            "sources_sha256":hashlib.sha256((ROOT/"sources.json").read_bytes()).hexdigest()}')
    (TARGET/'render.py').write_text(renderer,encoding='utf-8')
    notes='# Philippine news edition, October 3, 2026\n\nReports published October 2, checked just after midnight JST October 3.\nOriginal graphics and synthetic narration; no news footage or photos reused.\n\n'
    notes+='IPO pricing and planned listing are attributed announcements, not an investment recommendation. The company timetable is conditional.\nClimate risk is attributed to the CCC release and does not claim every locality faces drought.\nYape result checked against OCA and TV5; medal count limited to gold at that point.\n\nSources:\n'
    notes+='\n'.join('- '+s['url'] for s in sources['sources'])+'\n'
    (TARGET/'source-notes.md').write_text(notes,encoding='utf-8')
    print('Philippine source-backed edition prepared; speech, render and upload not yet performed.')

if __name__=='__main__': main()
