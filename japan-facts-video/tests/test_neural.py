import unittest
import tempfile
import wave
from pathlib import Path
from unittest.mock import patch
from japan_facts.core import Failure

class NeuralTests(unittest.TestCase):
    def test_audio_audition_does_not_require_video_caption_readability(self):
        from japan_facts.speech import cached_audio
        import shutil
        with tempfile.TemporaryDirectory() as root:
            def generated(config,operation,folder,*args):
                with wave.open(str(folder/'provider.wav'),'wb') as wav:
                    wav.setparams((1,2,24000,0,'NONE','')); wav.writeframes(b'\x01\x00'*24000)
                return {'audio_file':'provider.wav','events':[{'text':'conversational','start':.75}]}
            def convert(args,*unused): shutil.copyfile(args[3],args[-1])
            with patch('japan_facts.speech.worker',side_effect=generated), patch('japan_facts.production.run',side_effect=convert), patch('japan_facts.production.tool',return_value='ffmpeg'):
                self.assertEqual(cached_audio({'tts_provider':'azure-speech'},'conversational',{'ShortName':'voice'},{},root)[2],1)
    def test_stale_worker_response_never_counts_as_live(self):
        from japan_facts.speech import worker
        from japan_facts.research import write
        from types import SimpleNamespace
        with tempfile.TemporaryDirectory() as root:
            write(Path(root)/'response.json',{'voices':[{'ShortName':'old','Locale':'en-US'}]})
            with patch('japan_facts.speech.subprocess.run',return_value=SimpleNamespace(returncode=0)):
                with self.assertRaises(Failure): worker({'tts_provider':'azure-speech'},'list',root)
    def test_f0_output_publication_rights_not_assumed(self):
        from japan_facts.speech import edition_speech
        with patch('japan_facts.speech.voice_list') as network:
            with self.assertRaisesRegex(Failure,'publication rights'): edition_speech(None,{'tts_provider':'azure-speech'})
            network.assert_not_called()
    def test_missing_azure_credentials_stops_before_network(self):
        from japan_facts.speech_worker import azure_credentials
        with patch.dict('os.environ',{},clear=True), patch('japan_facts.speech_worker.arm') as network:
            with self.assertRaises(Failure): azure_credentials({})
            network.assert_not_called()
    def test_expired_voice_listing_does_not_use_old_response(self):
        from japan_facts.speech import voice_list
        with patch('japan_facts.speech.worker',side_effect=Failure('live provider failed')):
            with self.assertRaises(Failure): voice_list({'tts_provider':'azure-speech'})
    def test_edge_full_video_blocked_without_publication_rights(self):
        from japan_facts.speech import edition_speech
        with patch('japan_facts.speech.voice_list') as network:
            with self.assertRaises(Failure): edition_speech(None,{'tts_provider':'edge-tts'})
            network.assert_not_called()
    def test_cache_hit_avoids_resynthesis_and_corruption_fails(self):
        from japan_facts.speech import cached_audio
        from japan_facts.core import canonical,digest
        from japan_facts.research import write
        import hashlib
        config={'tts_provider':'azure-speech'}; voice={'ShortName':'current'}; delivery={}; text='Tokyo'
        key=hashlib.sha256(canonical({'schema':1,'provider':'azure-speech','voice':'current','settings':delivery,'text':text})).hexdigest()
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/key; p.mkdir()
            with wave.open(str(p/'audio.wav'),'wb') as wav:
                wav.setparams((1,2,24000,0,'NONE','')); wav.writeframes(b'\x01\x00'*24000)
            write(p/'words.json',[{'text':'Tokyo','start':.1,'index':0,'count':5}])
            write(p/'cache.json',{'duration':1,'audio_sha256':digest(p/'audio.wav'),'word_sha256':digest(p/'words.json')})
            with patch('japan_facts.speech.worker',side_effect=AssertionError('resynthesis')):
                self.assertTrue(cached_audio(config,text,voice,delivery,root)[3])
                (p/'audio.wav').write_bytes(b'corrupt')
                with self.assertRaises(Failure): cached_audio(config,text,voice,delivery,root)
    def test_only_f0_resource_and_matching_key(self):
        from japan_facts.speech import verify_resource
        resource={'kind':'SpeechServices','location':'japaneast','sku':{'name':'S0'}}
        with self.assertRaises(Failure): verify_resource(resource,{'key1':'secret'},'secret','japaneast')
        resource['sku']['name']='F0'
        with self.assertRaises(Failure): verify_resource(resource,{'key1':'other'},'secret','japaneast')
        verify_resource(resource,{'key1':'secret'},'secret','japaneast')
    def test_no_fast_rate_or_unsupported_style(self):
        from japan_facts.speech import settings
        voice={'ShortName':'live-voice','Locale':'en-US','StyleList':['chat']}
        for cfg in ({'rate_percent':30},{'style':'shouting'},{'pitch_hz':30}):
            with self.assertRaises(Failure): settings(cfg,voice,'azure-speech')
        self.assertEqual(settings({'style':'chat'},voice,'azure-speech')['rate_percent'],0)
    def test_edge_does_not_accept_azure_styles(self):
        from japan_facts.speech import settings
        with self.assertRaises(Failure): settings({'style':'chat'},{'ShortName':'voice'},'edge-tts')
    def test_events_map_to_original_text(self):
        from japan_facts.speech import map_words
        result=map_words('Tokyo, then Kyoto: 3 days.',[{'text':'Tokyo','start':0.1},{'text':'then','start':.5},{'text':'Kyoto','start':1},{'text':'3','start':1.5},{'text':'days','start':2}],3)
        self.assertEqual([w['index'] for w in result],[0,7,12,19,21])
    def test_malformed_word_event_fails(self):
        from japan_facts.speech import map_words
        with self.assertRaises(Failure): map_words('Tokyo',[{'text':'Osaka','start':0}],2)
    def test_live_voice_not_found_fails(self):
        from japan_facts.speech import find_voice
        with self.assertRaises(Failure): find_voice([{'ShortName':'current'}],'obsolete')
    def test_provider_failure_has_no_sapi_fallback(self):
        from japan_facts import production
        with patch('japan_facts.speech.edition_speech',side_effect=Failure('provider failed')) as neural, patch('japan_facts.production.run') as sapi:
            with self.assertRaises(Failure): production.synthesize(None,{'tts_provider':'azure-speech'})
            neural.assert_called_once(); sapi.assert_not_called()
    def test_neural_provider_config_is_supported(self):
        from japan_facts.research import check_providers
        check_providers({'tts_provider':'azure-speech'}); check_providers({'tts_provider':'edge-tts'})
    def test_selection_binds_provider_settings_and_preview(self):
        from japan_facts.speech import selection_binding
        a=selection_binding('azure-speech','voice',{'rate_percent':0},'hash')
        self.assertNotEqual(a,selection_binding('azure-speech','voice',{'rate_percent':5},'hash'))
        self.assertNotEqual(a,selection_binding('edge-tts','voice',{'rate_percent':0},'hash'))

if __name__=='__main__': unittest.main()
