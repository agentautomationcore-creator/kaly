import { Easing } from 'react-native-reanimated';

export const ANIM = {
  fast:   { duration: 150 },
  normal: { duration: 300 },
  slow:   { duration: 600 },
  ring:   { duration: 800, easing: Easing.bezier(0.4, 0, 0.2, 1) },
  spring: { damping: 12, stiffness: 180 },
} as const;
