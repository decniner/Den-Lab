import datetime as dt
import tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from japan_facts.core import Failure,Store
from japan_facts import production

class DailyTests(unittest.TestCase):
    def test_unreviewed_topics_are_not_daily_candidates(self):
        from japan_facts.research import reviewed_candidates
        with patch.object(Path,'is_file',side_effect=lambda: False):
            self.assertEqual(reviewed_candidates([{'fact_id':'new'}],Path('facts/catalog.json')),[])
    def test_tokyo_date_not_utc_date(self):
        from japan_facts.daily import edition_id
        self.assertEqual(edition_id(dt.datetime(2026,10,3,20,tzinfo=dt.timezone.utc)),'japan-explained-20261004-daily')
    def test_schedule_requires_standing_private_authorization(self):
        from japan_facts.daily import run_daily
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(Failure): run_daily(root,{})
    def test_electricity_scenes_are_supported_original_diagrams(self):
        scenes=['grid-hook','grid-split','grid-waves','grid-convert','grid-voltage','grid-check','grid-takeaway']
        with tempfile.TemporaryDirectory() as root:
            path=Path(root)/'scenes.ass'
            production.composition(path,49,[],[{'scene':s,'start':i*7,'end':(i+1)*7} for i,s in enumerate(scenes)],{'fact_id':'dual-frequency-grid'})
            text=path.read_text()
            self.assertIn('50 Hz',text); self.assertIn('60 Hz',text)
            self.assertNotIn('EARTHQUAKE',text)
    def test_uploaded_daily_resume_never_researches_again(self):
        from japan_facts.daily import run_daily,edition_id
        from japan_facts.research import write
        with tempfile.TemporaryDirectory() as root:
            store=Store(root,edition_id()); store.save({'stage':'uploaded'})
            write(Path(root)/'end-to-end.json',{'private_upload_verified':True,'video_id':'existing'})
            config={'schedule_enabled':True,'daily_private_authorization':'owner requested daily private uploads','private_review_only':True}
            with patch('japan_facts.daily.upload_existing',return_value={'id':'existing'}) as upload,patch('japan_facts.research.research_edition',side_effect=AssertionError('duplicate research')):
                self.assertEqual(run_daily(root,config)['id'],'existing'); upload.assert_called_once()
