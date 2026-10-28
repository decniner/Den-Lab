import json,tempfile,unittest
from pathlib import Path
from common import load_project,fingerprint,align_words,project_lock

class PipelineTests(unittest.TestCase):
    def test_lock_releases_even_when_file_remains(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)
            with project_lock(p):
                with self.assertRaises(ValueError):
                    with project_lock(p):pass
            self.assertTrue((p/'.film.lock').exists())
            with project_lock(p):pass
    def test_caption_punctuation_and_split_words(self):
        words=[{'t':0,'dur':.3,'text':'A'},{'t':.4,'dur':.5,'text':'human'},{'t':.9,'dur':.3,'text':'AI'},{'t':1.3,'dur':.6,'text':'conversation'}]
        got=align_words('A human–AI conversation.',words,2)
        self.assertEqual(' '.join(x['text'] for x in got),'A human–AI conversation.')
        self.assertEqual(got[1]['t'],.4)
        self.assertGreater(got[1]['dur'],.5)
    def test_cache_changes_with_text_or_voice(self):
        cfg={'human_voice':'one','human_rate':'-8%','ai_voice':'two','ai_rate':'-8%'}
        line={'who':'HUMAN','text':'A moment.'}
        one=fingerprint(line,cfg)
        self.assertNotEqual(one,fingerprint(dict(line,text='A memory.'),cfg))
        self.assertNotEqual(one,fingerprint(line,dict(cfg,human_voice='three')))
    def test_invalid_scene_fails_early(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td);(p/'film.json').write_text('{}')
            (p/'dialogue.json').write_text(json.dumps([{'who':'HUMAN','text':'Hello','scene':'typo','pause':.5}]))
            with self.assertRaises(ValueError):load_project(p)
    def test_empty_dialogue_fails(self):
        with tempfile.TemporaryDirectory() as td:
            p=Path(td);(p/'film.json').write_text('{}');(p/'dialogue.json').write_text('[]')
            with self.assertRaises(ValueError):load_project(p)

if __name__=='__main__':unittest.main()
