import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../lib/theme';
import { FONT_SIZE, RADIUS } from '../lib/constants';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
}

export function GradientHeader({ title, subtitle }: GradientHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 16,
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
      }}
    >
      <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: '700', color: '#FFFFFF' }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: FONT_SIZE.md, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}
    </LinearGradient>
  );
}
