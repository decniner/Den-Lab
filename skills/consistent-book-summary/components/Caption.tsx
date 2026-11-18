import React from 'react';
import captionStyle from '../caption_style.json';

export type CaptionWord = { text: string; active: boolean };
export type CaptionProps = { words: CaptionWord[] };

/** Fixed karaoke phrase; the burgundy word capsule advances with speech. */
export const Caption: React.FC<CaptionProps> = ({words}) => (
  <div style={{position:'absolute',left:captionStyle.left_x,top:captionStyle.baseline_y-captionStyle.font_size_px*0.84,
    whiteSpace:'nowrap',fontFamily:captionStyle.font_family,fontSize:captionStyle.font_size_px,fontWeight:captionStyle.font_weight,
    lineHeight:1,color:captionStyle.text_color,WebkitTextStroke:`${captionStyle.outline_width_px}px ${captionStyle.outline_color}`,
    textShadow:`${captionStyle.shadow_offset_px[0]}px ${captionStyle.shadow_offset_px[1]}px ${captionStyle.shadow_blur_px}px ${captionStyle.shadow_color}`}}>
    {words.map((w,i)=><React.Fragment key={i}><span style={w.active?{backgroundColor:captionStyle.active_background,borderRadius:captionStyle.active_radius,
      padding:`${captionStyle.active_padding_y}px ${captionStyle.active_padding_x}px`,margin:`-${captionStyle.active_padding_y}px -${captionStyle.active_padding_x}px`}:{}}>{w.text}</span>{i<words.length-1?' ':''}</React.Fragment>)}
  </div>
);
