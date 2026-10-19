import sys,unittest,xml.etree.ElementTree as ET
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from core import ease,partial,marker_paths,Canvas,resolve_cues
from calculations import calculate

class AnimationContracts(unittest.TestCase):
 def test_pen_reveal_preserves_travel_and_zero_ink(self):
  p=[(0,0),(100,0),(100,100)]
  self.assertEqual(partial(p,0),[])
  self.assertEqual(partial(p,.75),[(0,0),(100,0),(100,50)])
  self.assertEqual(partial(p,1),p)
 def test_marker_is_vector_geometry_and_progressive(self):
  paths=marker_paths('BORROW $10 MILLION',0,0,40)
  c=Canvas(400,200);c.ink(paths,.4,'#fff',3)
  root=ET.fromstring(c.svg())
  self.assertGreater(len(root.findall('{http://www.w3.org/2000/svg}polyline')),1)
  self.assertNotIn('<text',c.svg())
  a=Canvas(400,200);a.ink(paths,0,'#fff',3)
  self.assertNotIn('<polyline',a.svg())
 def test_ease_does_not_overshoot(self):
  vals=[ease(i/100) for i in range(101)]
  self.assertEqual((vals[0],vals[-1]),(0,1))
  self.assertEqual(sorted(vals),vals)
 def test_cues_reject_ambiguous_or_absent_phrases(self):
  words=[dict(text='Loan',start=0,end=.4),dict(text='cost',start=.5,end=.9)]
  self.assertEqual(resolve_cues(words,{'cost':'loan cost'})['cost'],0)
  with self.assertRaises(ValueError):resolve_cues(words,{'x':'unknown'})
 def test_interest_is_not_growth_and_not_amortization(self):
  r=calculate();self.assertEqual(r['annual_interest'],500000)
  self.assertEqual(r['principal_end'],10000000)
  self.assertEqual(r['total_due_after_one_unpaid_year'],10500000)
  self.assertEqual(r['initial_loan_to_value'],.5)

if __name__=='__main__':unittest.main()
