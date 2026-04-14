import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { RADIUS, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';

interface Phase {
  nameKey: string;
  hours: number;
  descKey: string;
}

const PHASES: Phase[] = [
  { nameKey: 'fasting.fed_state', hours: 0, descKey: 'fasting.fed_desc' },
  { nameKey: 'fasting.fat_burning', hours: 4, descKey: 'fasting.fat_burning_desc' },
  { nameKey: 'fasting.ketosis', hours: 8, descKey: 'fasting.ketosis_desc' },
  { nameKey: 'fasting.fat_burning', hours: 12, descKey: 'fasting.fat_burning_desc' },
  { nameKey: 'fasting.deep_ketosis', hours: 16, descKey: 'fasting.deep_ketosis_desc' },
  { nameKey: 'fasting.autophagy', hours: 20, descKey: 'fasting.autophagy_desc' },
];

function PulseDot({ color, bgColor }: { color: string; bgColor: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000 }),
        withTiming(1.0, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: color, backgroundColor: bgColor }, style]} />
  );
}

interface FastingPhasesProps {
  elapsedHours: number;
  targetHours: number;
}

export function FastingPhases({ elapsedHours, targetHours }: FastingPhasesProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const relevantPhases = PHASES.filter((p) => p.hours <= targetHours);

  return (
    <View style={{ gap: 0 }}>
      {relevantPhases.map((phase, idx) => {
        const isDone = elapsedHours >= phase.hours && (idx < relevantPhases.length - 1 ? elapsedHours >= relevantPhases[idx + 1].hours : elapsedHours >= phase.hours);
        const isActive = elapsedHours >= phase.hours && (idx === relevantPhases.length - 1 || elapsedHours < relevantPhases[idx + 1].hours);
        const isFuture = elapsedHours < phase.hours;
        const isLast = idx === relevantPhases.length - 1;

        const dotColor = isDone || isActive ? colors.primary : colors.border;
        const bgColor = isActive ? colors.fastingSubtle : isDone ? colors.primarySubtle : 'transparent';
        const borderColor = isActive ? colors.fasting : isDone ? colors.primary : colors.border;

        return (
          <View key={phase.nameKey} style={{ flexDirection: 'row', gap: 12 }}>
            {/* Timeline line + dot */}
            <View style={{ alignItems: 'center', width: 24 }}>
              {isActive ? (
                <PulseDot color={colors.fasting} bgColor={colors.fastingSubtle} />
              ) : isDone ? (
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={8} color={colors.textInverse} />
                </View>
              ) : (
                <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.border }} />
              )}
              {!isLast && (
                <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2 }} />
              )}
            </View>

            {/* Content */}
            <View
              style={{
                flex: 1,
                backgroundColor: bgColor,
                borderWidth: isActive ? 1 : 0,
                borderColor: borderColor,
                borderRadius: RADIUS.sm,
                padding: isActive ? SPACING[2] : 0,
                paddingBottom: isLast ? 0 : SPACING[3],
              }}
            >
              <Text
                style={{
                  ...typography.smallMedium,
                  color: isFuture ? colors.textTertiary : colors.textPrimary,
                }}
              >
                {t(phase.nameKey)} ({phase.hours}{t('fasting.hours_suffix')})
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                {t(phase.descKey)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
