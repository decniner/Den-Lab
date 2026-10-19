"""Scan illustration motion independently of header/footer text; no dependencies."""
import argparse,json,math,subprocess,sys
from pathlib import Path

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('video',type=Path);p.add_argument('--ffmpeg',default='ffmpeg')
 p.add_argument('--crop',default='1760:730:80:170')
 p.add_argument('--threshold',type=float,default=.12)
 p.add_argument('--quiet-seconds',type=int,default=4)
 p.add_argument('--intentional-hold-start',type=float)
 p.add_argument('--report',type=Path,required=True)
 args=p.parse_args()
 if not args.video.is_file():p.error('Video does not exist')
 if args.threshold<0 or args.quiet_seconds<1:p.error('Invalid motion threshold or quiet duration')
 # Grayscale scan avoids third-party dependencies. Default threshold remains
 # configurable because contrast and compression differ between projects.
 cmd=[args.ffmpeg,'-v','error','-threads','4','-i',str(args.video),'-vf',f'fps=1,crop={args.crop},scale=880:365','-an','-pix_fmt','gray','-f','rawvideo','pipe:1']
 proc=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 size=880*365;previous=None;quiet=0;holds=[];samples=[];second=0
 try:
  while True:
   data=bytearray()
   while len(data)<size:
    block=proc.stdout.read(size-len(data))
    if not block:break
    data.extend(block)
   if not data:break
   if len(data)!=size:raise RuntimeError('Incomplete decoded frame')
   if previous is not None:
    rms=math.sqrt(sum((a-b)**2 for a,b in zip(data,previous))/size)
    quiet=quiet+1 if rms<args.threshold else 0
    intentional=args.intentional_hold_start is not None and second>=args.intentional_hold_start
    samples.append(dict(second=second,rms=round(rms,4)))
    if quiet>=args.quiet_seconds and not intentional:holds.append(dict(second=second,quiet_seconds=quiet))
   previous=data;second+=1
  error=proc.stderr.read().decode(errors='replace');code=proc.wait()
  if code:raise RuntimeError(error or f'FFmpeg exited {code}')
  if second<args.quiet_seconds+1:raise RuntimeError('Video too short to establish the requested quiet interval')
 finally:
  if proc.poll() is None:proc.kill();proc.wait()
 report=dict(passed=not holds,video=str(args.video.resolve()),samples=samples,holds=holds,threshold=args.threshold,crop=args.crop,intentional_hold_start=args.intentional_hold_start,metric='Grayscale RMS on 880x365 physical-art crop at1fps')
 args.report.parent.mkdir(parents=True,exist_ok=True)
 args.report.write_text(json.dumps(report,indent=2),encoding='utf-8')
 print(json.dumps(dict(passed=report['passed'],holds=holds,sampled_frames=second)))
 return 0 if report['passed'] else 1

if __name__=='__main__':sys.exit(main())
