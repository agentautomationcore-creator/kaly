import React from 'react';
import { View } from 'react-native';
import { useColors } from '../lib/theme';
import { RADIUS } from '../lib/constants';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const colors = useColors();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 12 }}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <View
          key={step}
          style={{
            width: 8,
            height: 8,
            borderRadius: RADIUS.xs,
            marginHorizontal: 4,
            backgroundColor: step <= currentStep ? colors.primary : colors.border,
          }}
        />
      ))}
    </View>
  );
}
