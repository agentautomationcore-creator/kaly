import { I18nManager } from 'react-native';
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export const rtlIcon = <T extends IconName>(ltrName: T, rtlName: T): T =>
  I18nManager.isRTL ? rtlName : ltrName;

export const backIcon = () => rtlIcon('arrow-back', 'arrow-forward');
export const forwardIcon = () => rtlIcon('chevron-forward', 'chevron-back');
export const backChevron = () => rtlIcon('chevron-back', 'chevron-forward');
