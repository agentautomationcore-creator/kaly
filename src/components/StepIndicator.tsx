import React from 'react';
import { View } from 'react-native';
import { useColors } from '../lib/theme';
import { RADIUS, SPACING } from '../lib/constants';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: SPACING.md }}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <View
          key={step}
          style={{
            width: SPACING.sm,
            height: SPACING.sm,
            borderRadius: RADIUS.xs,
            marginHorizontal: SPACING.xs,
            backgroundColor: step <= currentStep ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}
