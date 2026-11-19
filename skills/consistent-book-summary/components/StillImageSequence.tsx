import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {Caption} from './Caption';

export type TimedStill = {src: string; startFrame: number; endFrame: number};

// Manifest paths may include the on-disk `public/` prefix; staticFile paths do not.
const publicAsset = (path: string) => staticFile(path.replace(/^public[\\/]/, ''));
export type TimedCaptionWord = {text: string; startFrame: number; endFrame: number};
export type TimedCaption = {startFrame: number; endFrame: number; words: TimedCaptionWord[]};
export type StillImageSequenceProps = {
  narrationSrc: string;
  hookCoverSrc: string;
  hookFrames: number;
  scenes: TimedStill[];
  captions: TimedCaption[];
};

/**
 * Stills-first vertical book summary. The hook replaces the opening scene image
 * for hookFrames; narration remains at frame zero. Scene changes are hard cuts.
 * No character rig, skeletal animation, or vector scene reconstruction is used.
 */
export const StillImageSequence: React.FC<StillImageSequenceProps> = ({
  narrationSrc, hookCoverSrc, hookFrames, scenes, captions,
}) => {
  const frame = useCurrentFrame();
  const currentScene = scenes.find((scene) => frame >= scene.startFrame && frame < scene.endFrame);
  const cue = captions.find((item) => frame >= item.startFrame && frame < item.endFrame);
  const words = cue?.words.map((word) => ({
    text: word.text,
    active: frame >= word.startFrame && frame < word.endFrame,
  })) ?? [];

  return (
    <AbsoluteFill style={{backgroundColor: '#e8dfd0'}}>
      <Audio src={publicAsset(narrationSrc)} startFrom={0}/>
      {currentScene && (
        <>
          {/* Match the approved short's soft, scene-colored full-frame ground. */}
          <Img src={publicAsset(currentScene.src)} style={{
            position: 'absolute', left: '-10%', top: '-5%', width: '120%', height: '110%',
            objectFit: 'cover', filter: 'blur(42px)', opacity: 0.35,
          }}/>
          <Img src={publicAsset(currentScene.src)} style={{
            position: 'absolute', left: 90, top: 300, width: 900, height: 900,
            objectFit: 'cover', boxShadow: '0 18px 44px rgba(35,28,24,.22)',
          }}/>
        </>
      )}
      {frame < hookFrames && (
        <Img src={publicAsset(hookCoverSrc)} style={{position: 'absolute', inset: 0, width: 1080, height: 1920}}/>
      )}
      {cue && words.length > 0 && <Caption words={words}/>}
    </AbsoluteFill>
  );
};
