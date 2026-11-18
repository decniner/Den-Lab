import React from 'react';
import captionStyle from '../caption_style.json';

export type CaptionWord = { text: string; active: boolean };
export type CaptionProps = { words: CaptionWord[] };

/** Fixed karaoke phrase; burgundy fill marks only the active spoken word. */
export const Caption: React.FC<CaptionProps> = ({words}) => (
  <svg width={captionStyle.canvas[0]} height={captionStyle.canvas[1]} viewBox={`0 0 ${captionStyle.canvas[0]} ${captionStyle.canvas[1]}`} style={{position:'absolute',inset:0,overflow:'visible'}}>
    <text x={captionStyle.left_x} y={captionStyle.baseline_y} fontFamily={captionStyle.font_family} fontSize={captionStyle.font_size_px}
      fontWeight={captionStyle.font_weight} letterSpacing="0" wordSpacing={`${captionStyle.word_gap_px}px`} textAnchor="start" dominantBaseline="alphabetic"
      paintOrder="stroke fill" stroke={captionStyle.outline_color} strokeWidth={captionStyle.outline_width_px}
      strokeLinejoin="round" style={{filter:`drop-shadow(${captionStyle.shadow_offset_px[0]}px ${captionStyle.shadow_offset_px[1]}px ${captionStyle.shadow_blur_px}px ${captionStyle.shadow_color})`}}>
      {words.map((w,i)=><tspan key={i} fill={w.active?captionStyle.active_color:captionStyle.text_color}>{i>0?' ':''}{w.text}</tspan>)}
    </text>
  </svg>
);
