import importlib.util,sys,unittest
from pathlib import Path

class NarrationTests(unittest.TestCase):
    def helpers(self):
        path=Path(__file__).with_name('narration.py')
        self.assertTrue(path.is_file(),'Reusable speech/caption helpers are missing')
        spec=importlib.util.spec_from_file_location('narration',path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        return module
    def test_caption_reveals_only_the_spoken_word(self):
        active=self.helpers().active_word
        scene={'start':2,'words':[{'text':'Wait,','t':.3,'dur':.2},{'text':'now.','t':.6,'dur':.2}]}
        self.assertIsNone(active(scene,2.299))
        self.assertEqual(active(scene,2.301),'Wait,')
        self.assertIsNone(active(scene,2.55))
        self.assertEqual(active(scene,2.601),'now.')
        self.assertIsNone(active(scene,2.801))
    def test_cache_invalidates_for_seed_text_model_and_reference(self):
        key=self.helpers().speech_key
        row={'who':'HUMAN','text':'Who holds the key?'}
        original=key(row,'model-a','ref-a',107)
        self.assertNotEqual(original,key(row,'model-a','ref-a',2113))
        self.assertNotEqual(original,key(dict(row,text='Who opens the door?'),'model-a','ref-a',107))
        self.assertNotEqual(original,key(row,'model-b','ref-a',107))
        self.assertNotEqual(original,key(row,'model-a','ref-b',107))

if __name__=='__main__':unittest.main()
