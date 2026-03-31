import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useColors } from '../lib/theme';
import { RADIUS } from '../lib/constants';

interface ProgressBarProps {
  value: number;      // current
  max: number;        // goal
  color?: string;
  label?: string;
  showValue?: boolean;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  max,
  color,
  label,
  showValue = true,
  height = 8,
  style,
}: ProgressBarProps) {
  const colors = useColors();
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const barColor = color || colors.primary;

  return (
    <View style={style}>
      {(label || showValue) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          {label ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>
              {label}
            </Text>
          ) : null}
          {showValue ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {Math.round(value)} / {Math.round(max)}
            </Text>
          ) : null}
        </View>
      )}
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${percentage}%`,
            borderRadius: height / 2,
            backgroundColor: barColor,
          }}
        />
      </View>
    </View>
  );
}
