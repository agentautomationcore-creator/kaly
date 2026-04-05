import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../lib/theme';
import { FONT_SIZE, RADIUS, SPACING } from '../lib/constants';

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
        paddingTop: insets.top + SPACING.lg,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xl,
      }}
    >
      <Text style={{ fontSize: FONT_SIZE.xxl, fontWeight: '700', color: colors.textOnPrimary }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: FONT_SIZE.md, color: colors.textOnPrimary, opacity: 0.9, marginTop: SPACING.xs }}>
          {subtitle}
        </Text>
      ) : null}
    </LinearGradient>
  );
}
