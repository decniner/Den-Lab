from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parent
for p in [ROOT/'deps',ROOT.parent/'earth-series-part-01-before-earth/render-deps',Path('C:/Users/DenDev/Documents/Codex/2026-10-01/check-my-computers-bios-firmware-using-powershell-and-sh/.render-deps')]:
 if p.exists():sys.path.append(str(p))
