import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { Card } from '../../../components/Card';
import { FONT_SIZE, RADIUS, SPACING } from '../../../lib/constants';

interface StreakCounterProps {
  count: number;
}

export function StreakCounter({ count }: StreakCounterProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: RADIUS.full,
          backgroundColor: count > 0 ? colors.warningLight : colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="flame" size={24} color={count > 0 ? colors.warning : colors.textSecondary} />
      </View>
      <View>
        <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.text }}>
          {count > 0 ? t('stats.streak', { count }) : t('stats.no_streak')}
        </Text>
      </View>
    </Card>
  );
}
