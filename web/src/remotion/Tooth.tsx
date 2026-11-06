import React from 'react';
import { TOOTH_PATH } from './theme';

export const Tooth: React.FC<{ size: number; fill?: string; glow?: string; style?: React.CSSProperties }> = ({
  size,
  fill = '#fff',
  glow = 'rgba(0,180,216,.45)',
  style,
}) => (
  <svg viewBox="0 0 64 64" width={size} height={size} style={{ filter: `drop-shadow(0 12px 24px ${glow})`, ...style }} aria-hidden>
    <path d={TOOTH_PATH} fill={fill} stroke="#bfe9f4" strokeWidth={1.5} />
    <path d="M22 16c2-3 6-3 8-2" stroke="#e8f8fc" strokeWidth={3} strokeLinecap="round" fill="none" />
  </svg>
);
