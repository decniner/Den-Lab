"""Frame-rounded measured narration timing for the four-scene sample film."""
from config import ROOT
from prepare_artwork import NAMES
import json,math
def timeline():
    sections=json.loads((ROOT/'narration/sections.json').read_text())
    if len(sections)!=5: raise ValueError('Adapt the scene-to-paragraph mapping for this new script; sample expects five paragraphs.')
    end=sections[-1]['end']; total=max(30,math.ceil((end+1.25)*30)/30)
    bounds=[round(v*30)/30 for v in [0,sections[1]['start'],sections[2]['start'],sections[4]['start'],total]]
    scenes=[]
    for i,name in enumerate(NAMES):
        start,finish=bounds[i:i+2]; duration=finish-start
        scenes.append(dict(name=name,start=start,end=finish,duration=duration,drawing_duration=duration*.47 if i<3 else 0))
    data=dict(fps=30,width=1920,height=1080,duration=total,narration_end=end,scenes=scenes,hand='No hand; tiny 40px pencil',style='Original Studio Ghibli-inspired painterly imagery; exact studio identity not claimed',drawing='Faint raster-derived underdrawing, ordered contours and a separate soft color finish; accelerated illustrative reveal')
    (ROOT/'scene-timing.json').write_text(json.dumps(data,indent=2)); return data
if __name__=='__main__': print(timeline())
