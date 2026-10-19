from pathlib import Path
import os, sys
ROOT = Path(__file__).resolve().parent
RENDER_DEPS = Path(os.environ.get('WHITEBOARD_RENDER_DEPS', 'C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.render-deps'))
if sys.version_info[:2] == (3,14):
    sys.path.insert(0, str(RENDER_DEPS))
FFMPEG = str(RENDER_DEPS / 'imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe')
VOICE_SETUP = Path(os.environ.get('WHITEBOARD_VOICE_SETUP', 'C:/Users/DenDev/Documents/Codex/2026-10-07/hi-there/brutal-truth-money-kokoro-v4'))
VOICE_PYTHON = str(VOICE_SETUP / 'python312/python.exe')
for folder in ['artwork','paths','narration','renders','output','review','logs']:
    (ROOT / folder).mkdir(exist_ok=True)
