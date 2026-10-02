"""Save minimal supporting snippets once and explicitly label offline fixtures."""
from pathlib import Path
import json
from japan_facts.research import review_hash,write

root=Path(__file__).resolve().parent.parent
p=root/'facts'/'shinkansen-wave-warning.json'
d=json.loads(p.read_text(encoding='utf-8'))
excerpts={
 'jr-detection':{'detect':'detects preliminary earthquake tremors (P waves)','warn':'immediately issues earthquake warning information'},
 'jr-brakes':{'brake':'the emergency brake is applied','power':'the power cut is detected onboard'},
 'usgs-waves':{'prediction':'not earthquake prediction','started':'already started','first':'fastest-moving seismic waves',
               'stronger':'slower moving, and generally more damaging','signal':'many times faster than seismic waves','protect':'slowing a train'},
 'jma-limits':{'late':'the warning may not be transmitted before strong tremors hit'},
 'jr-current':{'current':'Measures for Emergency Stopping of Trains'}}
refs={
 'early-braking':[('jr-detection','detect'),('jr-brakes','brake'),('usgs-waves','signal')],
 'detection-not-prediction':[('usgs-waves','prediction'),('usgs-waves','started')],
 'p-wave-first':[('jr-detection','detect'),('usgs-waves','first')],
 'slower-stronger':[('usgs-waves','stronger')],
 'sensor-warning':[('jr-detection','detect'),('jr-detection','warn')],
 'power-cut-brakes':[('jr-brakes','power'),('jr-brakes','brake'),('jr-current','current')],
 'signals-outrun-waves':[('usgs-waves','signal')],
 'warning-limit':[('jma-limits','late')],
 'takeaway':[('usgs-waves','protect'),('usgs-waves','signal')]}
for source in d['sources']:
    source['excerpts']=[{'id':key,'quote':quote} for key,quote in excerpts[source['id']].items()]
    assert sum(len(q['quote'].split()) for q in source['excerpts'])<=25
for claim in d['claims']:
    claim['evidence']=[{'source':source,'quote_ref':ref} for source,ref in refs[claim['id']]]
d['review']['content_sha256']=review_hash(d)
write(p,d)
fixture=dict(d,fixture=True,fixture_only=True)
fixture['review']=dict(d['review'],reviewed_by='Offline fixture reviewer')
fixture['review']['content_sha256']=review_hash(fixture)
write(root/'fixtures'/'fact-pack.json',fixture)
write(root/'fixtures'/'source-texts.json',{source:' '.join(items.values()) for source,items in excerpts.items()})
print('Minimal evidence snippets and explicit fixtures saved; live research has not run.')
