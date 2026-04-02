import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
}

export default function AppLogo({ size = 32 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect width={32} height={32} rx={8} fill="#1B6EF3" />
      <Path
        d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6z"
        fill="rgba(255,255,255,0.15)"
      />
      <Path
        d="M21 15h-4v-4a1 1 0 0 0-2 0v4h-4a1 1 0 0 0 0 2h4v4a1 1 0 0 0 2 0v-4h4a1 1 0 0 0 0-2z"
        fill="#fff"
      />
      <Circle cx={16} cy={16} r={9} stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} fill="none" />
    </Svg>
  );
}
