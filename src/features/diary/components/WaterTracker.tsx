import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../../lib/theme';
import { useWater } from '../hooks/useWater';
import { useHealthKit } from '../../../hooks/useHealthKit';
import { WATER_GLASS_ML } from '../../../lib/constants';
import { Card } from '../../../components/Card';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';

interface WaterTrackerProps {
  date: string;
  goalGlasses?: number;
}

export function WaterTracker({ date, goalGlasses = 8 }: WaterTrackerProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { glasses, addGlass } = useWater(date);
  const { saveWater } = useHealthKit();

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="water" size={18} color={colors.info} />
          <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
            {t('diary.water')}
          </Text>
        </View>
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
          {t('diary.water_goal', { current: glasses, goal: goalGlasses })}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: goalGlasses }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < glasses ? colors.info : colors.surface,
              }}
            />
          ))}
        </View>

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); addGlass.mutate(undefined, { onSuccess: () => { saveWater(WATER_GLASS_ML).catch(() => {}); } }); }}
          disabled={addGlass.isPending}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: addGlass.isPending ? colors.border : colors.info,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          accessibilityLabel={t('diary.add_water')}
        >
          <Ionicons name="add" size={24} color={colors.card} />
        </Pressable>
      </View>
    </Card>
  );
}
