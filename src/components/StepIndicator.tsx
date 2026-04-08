import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../lib/theme';
import { RADIUS, SPACING } from '../lib/constants';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  const colors = useColors();
  const { t } = useTranslation();

  return (
    <View accessibilityLabel={t('onboarding.step_of', { current: currentStep, total: totalSteps })} style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: SPACING.md }}>
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
