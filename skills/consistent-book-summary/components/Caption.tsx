import React from 'react';

export type CaptionWord = { text: string; active: boolean };
export type CaptionProps = {
  words: CaptionWord[];
  fontFamily: string;
  fontSize: number;
  baselineY: number;
  leftX: number;
  colors: { ink: string; outline: string; highlight: string; shadow: string };
  strokeWidth: number;
};

/** One SVG text baseline shared by every tspan; no per-word vertical movement. */
export const Caption: React.FC<CaptionProps> = ({words,fontFamily,fontSize,baselineY,leftX,colors,strokeWidth}) => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,overflow:'visible'}}>
    <text x={leftX} y={baselineY} fontFamily={fontFamily} fontSize={fontSize}
      fontWeight={900} textAnchor="start" dominantBaseline="alphabetic"
      paintOrder="stroke fill" stroke={colors.outline} strokeWidth={strokeWidth}
      strokeLinejoin="round" style={{filter:`drop-shadow(2px 3px 2px ${colors.shadow})`}}>
      {words.map((w,i)=><tspan key={i} fill={w.active?colors.highlight:colors.ink}>{i>0?' ':''}{w.text}</tspan>)}
    </text>
  </svg>
);
