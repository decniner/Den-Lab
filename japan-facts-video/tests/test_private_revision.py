import unittest
import tempfile
from pathlib import Path
from unittest.mock import patch
from japan_facts.core import Failure, Store
from japan_facts.research import write

class PrivateRevisionTests(unittest.TestCase):
    def test_private_scope_requires_explicit_authorization(self):
        from japan_facts.speech import publication_scope
        with self.assertRaises(Failure): publication_scope({'tts_provider':'edge-tts','private_review_only':True})
        self.assertEqual(publication_scope({'tts_provider':'edge-tts','private_review_only':True,'private_review_authorization':'Owner explicitly requested private regeneration/upload'}),'private-review-only')

    def test_public_publish_blocked_before_api_for_private_review(self):
        from japan_facts import youtube
        with tempfile.TemporaryDirectory() as root:
            store=Store(root,'edition'); store.path.mkdir()
            write(store.path/'speech-provider.json',{'publication_scope':'private-review-only'})
            api=unittest.mock.Mock()
            with self.assertRaisesRegex(Failure,'private review'): youtube.publish(store,{},api,'approval')
            api.check_channel.assert_not_called()

    def test_revision_requires_exact_parent_and_new_id(self):
        from japan_facts.revision import create_revision
        with tempfile.TemporaryDirectory() as root:
            store=Store(root,'new')
            with self.assertRaises(Failure): create_revision(store,Path(root)/'missing','wrong')

if __name__=='__main__': unittest.main()
