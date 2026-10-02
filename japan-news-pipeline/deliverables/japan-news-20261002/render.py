"""Render this reviewed-source edition locally. No network calls or publishing.

This is an edition-specific composition, separate from the extract-only CLI.
Its paraphrased script has an explicit source map and awaits operator review.
"""
import hashlib
import json
import math
import os
import re
import subprocess
import textwrap
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT.parent.parent
BIN = WORKSPACE / ".tools/ffmpeg/ffmpeg-9.0.2-essentials_build/bin"
FFMPEG = str(BIN / "ffmpeg.exe")
FFPROBE = str(BIN / "ffprobe.exe")
SLOTS = {"intro": (0, 6), "drone": (6, 25), "policy": (25, 49), "tankan": (49, 75), "outro": (75, 80)}

def run(args, timeout=600):
    result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError("Media command failed: " + result.stderr[-3000:])
    return result

def load(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))

def wav_length(path):
    with wave.open(str(path), "rb") as stream:
        if (stream.getnchannels(), stream.getsampwidth()) != (1, 2) or stream.getframerate() not in (16000,24000):
            raise ValueError("Narration must be mono 16/24 kHz 16-bit PCM")
        return stream.getnframes() / stream.getframerate()

def combine(paths, target):
    with wave.open(str(paths[0]), "rb") as first: rate = first.getframerate()
    with wave.open(str(target), "wb") as output:
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(rate)
        for path in paths:
            with wave.open(str(path), "rb") as source:
                if source.getframerate()!=rate: raise ValueError("Mixed sample rates")
                output.writeframes(source.readframes(source.getnframes()))

def fit_narration(script):
    captions = []
    fitted = []
    adjustments = {}
    for story, (start, end) in SLOTS.items():
        members = [(i, s) for i, s in enumerate(script["segments"]) if s["story"] == story]
        paths = [ROOT / "speech" / f"segment-{i:04}.wav" for i, _ in members]
        lengths = [wav_length(path) for path in paths]
        raw_length = sum(lengths)
        tempo = raw_length / (end - start - .2)
        if not .8 <= tempo <= 1.2:
            raise ValueError(f"Narration pacing exceeds approved natural range for {story}: {tempo}")
        adjustments[story] = {"raw_seconds": raw_length, "target_seconds": end-start, "tempo_factor": tempo}
        raw = ROOT / f"{story}-raw.wav"
        output = ROOT / f"{story}-fit.wav"
        combine(paths, raw)
        frames = int((end-start)*24000)
        run([FFMPEG, "-y", "-i", str(raw), "-af", f"aresample=24000,atempo={tempo:.12f},apad,atrim=end_sample={frames},asetpts=PTS-STARTPTS",
             "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", str(output)], 60)
        if abs(wav_length(output) - (end-start)) > 1/24000:
            raise ValueError("Fitted narration duration mismatch")
        fitted.append(output)
        cursor = start
        for (index, segment), path, length in zip(members, paths, lengths):
            words = load(str(path) + ".words.json")
            if not isinstance(words, list) or not words: raise ValueError("Word timing events missing")
            if any(w["start"] < 0 or w["start"] > length for w in words): raise ValueError("Word timestamp outside narration")
            if any(words[i]["start"] > words[i+1]["start"] for i in range(len(words)-1)):
                raise ValueError("Word events are not ordered")
            original = segment["text"]
            at = 0
            while at < len(words):
                stop = at+1
                while stop < len(words) and stop-at < 5:
                    candidate_end = words[stop]["index"] + words[stop]["count"]
                    if len(original[words[at]["index"]:candidate_end]) > 39: break
                    stop += 1
                char_end = words[stop]["index"] if stop < len(words) else len(original)
                text = original[words[at]["index"]:char_end].strip()
                begin = cursor + words[at]["start"]/tempo
                finish = cursor + (words[stop]["start"] if stop < len(words) else length)/tempo
                if not text or finish <= begin: raise ValueError("Invalid caption group")
                if len(text)/(finish-begin) > 30: raise ValueError("Caption pacing exceeds 30 characters/second")
                captions.append({"start": begin, "end": finish, "text": text, "story": story})
                at = stop
            cursor += length / tempo
    combine(fitted, ROOT / "narration-80s.wav")
    if wav_length(ROOT / "narration-80s.wav") != 80: raise ValueError("Final narration must be exactly 80 seconds")
    for i, caption in enumerate(captions):
        if caption["start"] < 0 or caption["end"] > 80 or caption["end"] <= caption["start"]:
            raise ValueError("Caption outside final audio")
        if i and captions[i-1]["end"] > caption["start"] + .001: raise ValueError("Caption overlap")
    (ROOT / "captions.json").write_text(json.dumps(captions, indent=2), encoding="utf-8")
    return captions, adjustments

def ass_time(value):
    cs = round(value*100); h, cs = divmod(cs, 360000); m, cs = divmod(cs, 6000); s, cs = divmod(cs,100)
    return f"{h}:{m:02}:{s:02}.{cs:02}"

def color(rgb):
    return "&H" + rgb[4:6]+rgb[2:4]+rgb[0:2] + "&"

def escape(text):
    return text.replace("\\", "").replace("{", "").replace("}", "").replace("\n", "\\N")

def composition(captions):
    events = []
    def event(begin, end, layer, content, style="Graphic"):
        events.append(f"Dialogue: {layer},{ass_time(begin)},{ass_time(end)},{style},,0,0,0,,{content}")
    def text(begin, end, content, x, y, size=40, rgb="FFFFFF", bold=True, animate=True, align=7):
        movement = f"\\move({x+24},{y},{x},{y},0,250)\\fad(120,100)" if animate else f"\\pos({x},{y})"
        tags = f"\\an{align}{movement}\\fs{size}\\b{int(bold)}\\1c{color(rgb)}\\bord0\\shad0"
        event(begin,end,2,"{"+tags+"}"+escape(content))
    def shape(begin, end, x, y, path, rgb, layer=0, tags=""):
        event(begin,end,layer,"{"+f"\\an7\\pos({x},{y})\\p1\\1c{color(rgb)}\\bord0\\shad0"+tags+"}"+path+"{\\p0}")
    def box(begin,end,x,y,width,height,rgb,layer=0,tags=""):
        shape(begin,end,x,y,f"m 0 0 l {width} 0 {width} {height} 0 {height}",rgb,layer,tags)
    def panel(begin,end):
        box(begin,end,80,610,800,585,"102238",0)
        box(begin,end,80,610,7,585,"FC555D",1)
    # Everything stays left of the TikTok action rail and above its description area.
    for y in range(0,1920,120): box(0,80,0,y,1080,1,"112235")
    for x in range(0,1080,120): box(0,80,x,0,1,1920,"112235")
    box(0,80,80,178,60,6,"FC555D")
    text(0,80,"JAPAN TODAY",80,112,32,animate=False)
    text(0,80,"02 OCT 2026",80,214,25,"A6B9CE",False,False)
    text(0,80,"Synthetic narration  /  Original graphics",80,1615,23,"A6B9CE",False,False)
    box(0,80,80,1545,800,5,"23384F")
    box(0,80,80,1545,800,5,"FC555D",1,"\\clip(80,1545,80,1550)\\t(0,80000,\\clip(80,1545,880,1550))")
    # Opening card.
    text(0,6,"THREE UPDATES",80,315,28,"4CDCC7")
    text(0,6,"JAPAN\nIN 80 SECONDS",80,415,82)
    text(0,6,"DEFENSE  /  POLICY  /  BUSINESS",80,695,25,"A6B9CE",False)
    text(0,6,"01",80,865,120,"FC555D")
    text(0,6,"DRONE RECOVERY",275,910,35)
    text(0,6,"02",80,1050,120,"4CDCC7")
    text(0,6,"MONETARY POLICY",275,1095,35)
    text(0,6,"03",80,1235,120,"FFD166")
    text(0,6,"BUSINESS MOOD",275,1280,35)
    # Recovery: diagram is explicitly described as an illustration.
    a,b=6,25; panel(a,b)
    text(a,b,"01 / DEFENSE",80,290,27,"FC555D")
    text(a,b,"DRONE\nRECOVERY BEGINS",80,375,72)
    text(a,b,"OFF TOTTORI",120,650,28,"4CDCC7")
    box(a,b,120,745,710,3,"4CDCC7",1)
    for x in range(130,830,80): box(a,b,x,766,42,1,"285874",1)
    for y in range(790,1080,30): box(a,b,730,y,3,14,"49617B",1)
    text(a,b,"200-300 m",120,835,74,"FFFFFF")
    text(a,b,"Apparent fuselage depth",120,940,29,"A6B9CE",False)
    text(a,b,"SCHEMATIC / NOT EVENT FOOTAGE",120,1120,22,"A6B9CE",False)
    shape(a,b,150,1040,"m 0 25 l 55 18 83 0 102 0 92 17 170 30 170 40 92 34 101 56 83 56 55 38 0 35", "4CDCC7",1,"\\move(150,1030,170,1060,0,18000)")
    text(a,b,"SOURCE: ASSOCIATED PRESS / OCT 2",80,1250,25,"A6B9CE",False)
    # Government statement, without presenting it as a rate announcement.
    a,b=25,49; panel(a,b)
    text(a,b,"02 / MONETARY POLICY",80,290,27,"4CDCC7")
    text(a,b,"KIUCHI ON\nJAPAN'S POLICY",80,375,72)
    text(a,b,"THE ECONOMY MINISTER'S VIEW",120,650,24,"A6B9CE",False)
    text(a,b,"NO NEED FOR\nEXCESSIVELY\nLOOSE POLICY",120,750,61,"4CDCC7")
    text(a,b,"Rate decisions: Bank of Japan",120,1080,31)
    text(a,b,"A statement / no new rate announcement",120,1140,24,"A6B9CE",False)
    text(a,b,"SOURCE: REUTERS VIA CNA / OCT 2",80,1250,25,"A6B9CE",False)
    # Compare June and September actual readings from BOJ's primary table.
    a,b=49,75; panel(a,b)
    text(a,b,"03 / BUSINESS SENTIMENT",80,290,27,"FFD166")
    text(a,b,"FACTORY MOOD\nIMPROVES",80,375,72)
    text(a,b,"LARGE MANUFACTURERS",120,650,26,"A6B9CE",False)
    box(a,b,200,824,150,176,"49617B",1,"\\fad(250,120)")
    box(a,b,535,808,150,192,"4CDCC7",1,"\\fad(250,120)")
    text(a,b,"+22",200,730,58)
    text(a,b,"+24",535,705,70,"4CDCC7")
    text(a,b,"JUNE",200,1030,24,"A6B9CE",False)
    text(a,b,"SEPTEMBER",500,1030,24,"A6B9CE",False)
    text(a,b,"LARGE NONMANUFACTURERS",120,1095,23,"A6B9CE",False)
    text(a,b,"+37  >  +35",120,1140,39,"FFD166")
    text(a,b,"SOURCE: BANK OF JAPAN / OCT 1",80,1250,25,"A6B9CE",False)
    text(a,b,"Sentiment index readings / not growth rates",80,1290,23,"A6B9CE",False)
    # Five-second source card.
    a,b=75,80
    text(a,b,"READ THE SOURCES",80,355,59)
    text(a,b,"ASSOCIATED PRESS",80,625,45,"FC555D")
    text(a,b,"Drone recovery / October 2",80,700,29,"A6B9CE",False)
    text(a,b,"REUTERS VIA CNA",80,860,45,"4CDCC7")
    text(a,b,"Minister's remarks / October 2",80,935,29,"A6B9CE",False)
    text(a,b,"BANK OF JAPAN",80,1095,45,"FFD166")
    text(a,b,"Tankan survey / October 1",80,1170,29,"A6B9CE",False)
    text(a,b,"Links in the accompanying source notes",80,1325,26,"A6B9CE",False)
    # Word-event aligned short captions: 1–2 lines, safely clear of app controls.
    for caption in captions:
        lines = textwrap.wrap(caption["text"],width=25,break_long_words=False,break_on_hyphens=False)
        if len(lines)>2: raise ValueError("Caption requires more than two lines")
        event(caption["start"],caption["end"],5,"{\\fad(35,35)}"+escape("\n".join(lines)),"Caption")
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Graphic,Arial,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,7,80,180,0,1
Style: Caption,Arial,56,&H00FFFFFF,&H00FFFFFF,&H00100A05,&H00100A05,-1,0,0,0,100,100,0,0,1,4,1,2,95,190,400,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    (ROOT/"composition.ass").write_text(header+"\n".join(events)+"\n",encoding="utf-8")

def validate(output, captions, adjustments):
    info=json.loads(run([FFPROBE,"-v","error","-show_streams","-show_format","-of","json",str(output)],30).stdout)
    video=[s for s in info["streams"] if s["codec_type"]=="video"]
    audio=[s for s in info["streams"] if s["codec_type"]=="audio"]
    if len(video)!=1 or len(audio)!=1: raise ValueError("Expected exactly one video and one audio stream")
    if (video[0]["width"],video[0]["height"],video[0]["codec_name"])!=(1080,1920,"h264"):
        raise ValueError("Incorrect portrait video format")
    if audio[0]["codec_name"]!="aac": raise ValueError("AAC audio required")
    if abs(float(info["format"]["duration"])-80)>.04: raise ValueError("Final video is not 80 seconds")
    if int(video[0]["nb_frames"])!=2400: raise ValueError("Expected 2400 frames at 30 fps")
    run([FFMPEG,"-v","error","-xerror","-i",str(output),"-f","null","-"],300)
    volume=run([FFMPEG,"-i",str(output),"-af","volumedetect","-f","null","-"],120).stderr
    match=re.search(r"mean_volume: ([\-\d.]+) dB",volume)
    if not match or float(match[1]) < -40: raise ValueError("Narration is silent or too quiet")
    report={"edition":"japan-news-20261002-en","mode":"live-news","fixture":False,
            "video_path":str(output),"video_sha256":hashlib.sha256(output.read_bytes()).hexdigest(),
            "duration_seconds":float(info["format"]["duration"]),"width":1080,"height":1920,
            "frames":2400,"fps":30,"video_codec":"h264","audio_codec":"aac",
            "decode_validation":"passed","caption_timing":"speech-event timestamps, adjusted with audio pacing",
            "caption_groups":len(captions),"mean_audio_db":float(match[1]),"pacing":adjustments,
            "sources":"sources.json","source_review":"assistant source check; operator approval pending",
            "public_approval":None,"upload":"not attempted","video_id":None,"url":None,
            "returned_visibility":None,"paid_jobs":0}
    (ROOT/"validation.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report))

def main():
    script=load(ROOT/"script.json")
    sources=load(ROOT/"sources.json")
    known={s["id"] for s in sources["sources"]}
    if any(s.get("source") not in known for s in script["segments"] if s["story"] not in ("intro","outro")):
        raise ValueError("Unsupported segment without a checked source")
    captions,adjustments=fit_narration(script)
    composition(captions)
    output=ROOT/"japan-news-80s-tiktok.mp4"
    run([FFMPEG,"-y","-f","lavfi","-i","color=c=0x08111f:s=1080x1920:r=30:d=80",
         "-i",str(ROOT/"narration-80s.wav"),"-vf","ass=composition.ass",
         "-c:v","libx264","-preset","fast","-crf","20","-pix_fmt","yuv420p",
         "-c:a","aac","-b:a","160k","-af","loudnorm=I=-16:TP=-1.5:LRA=7",
         "-t","80","-movflags","+faststart",str(output)],600)
    validate(output,captions,adjustments)
    for second in (3,12,34,60,77):
        run([FFMPEG,"-y","-ss",str(second),"-i",str(output),"-frames:v","1",str(ROOT/f"preview-{second:02}.jpg")],30)

if __name__=="__main__": main()
