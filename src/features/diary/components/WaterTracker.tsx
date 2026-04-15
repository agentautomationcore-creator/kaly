import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../../lib/theme';
import { useWater } from '../hooks/useWater';
import { useHealthKit } from '../../../hooks/useHealthKit';
import { captureException } from '../../../lib/sentry';
import { WATER_GLASS_ML, RADIUS, SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';

interface WaterTrackerProps {
  date: string;
  goalGlasses?: number;
}

export function WaterTracker({ date, goalGlasses = 8 }: WaterTrackerProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { glasses, addGlass, removeGlass } = useWater(date);
  const { saveWater } = useHealthKit();

  const handleAdd = () => {
    if (addGlass.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addGlass.mutate(undefined, {
      onSuccess: () => { saveWater(WATER_GLASS_ML).catch(() => {}); },
      onError: (e) => { captureException(e, { feature: 'water_add' }); },
    });
  };

  const handleRemove = () => {
    if (glasses <= 0 || removeGlass.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeGlass.mutate(undefined, {
      onError: (e) => { captureException(e, { feature: 'water_remove' }); },
    });
  };

  return (
    <View
      style={{
        backgroundColor: colors.secondarySubtle,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: RADIUS.lg,
        marginHorizontal: 0,
        paddingVertical: 14,
        paddingHorizontal: SPACING[4],
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>{'\uD83D\uDCA7'}</Text>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>
            {t('diary.water')}
          </Text>
        </View>
        <Text style={{ ...typography.smallMedium, color: colors.textSecondary }}>
          {glasses} / {goalGlasses}
        </Text>
      </View>

      {/* Glasses row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: goalGlasses }).map((_, i) => (
            <Text
              key={i}
              style={{ fontSize: 22, opacity: i < glasses ? 1 : 0.3, flex: 1, textAlign: 'center' }}
            >
              {'\uD83E\uDD64'}
            </Text>
          ))}
        </View>

        {/* Minus button */}
        <Pressable
          onPress={handleRemove}
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel={t('diary.remove_water')}
          accessibilityRole="button"
        >
          <Ionicons name="remove" size={18} color={colors.textSecondary} />
        </Pressable>

        {/* Plus button */}
        <Pressable
          onPress={handleAdd}
          disabled={addGlass.isPending}
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel={t('diary.add_water')}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
