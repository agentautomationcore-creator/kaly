import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../../../lib/constants';

const PORTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function PortionSlider() {
  const { t } = useTranslation();
  const colors = useColors();
  const { portionMultiplier, setPortionMultiplier } = useScanStore();

  return (
    <View>
      <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
        {t('scan.portion')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
        {PORTIONS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPortionMultiplier(p)}
            accessibilityLabel={`${t('scan.portion')} ${p}x`}
            accessibilityRole="button"
            style={{
              minWidth: '30%',
              flexGrow: 1,
              minHeight: MIN_TOUCH,
              paddingVertical: 10,
              borderRadius: RADIUS.md,
              backgroundColor: portionMultiplier === p ? colors.primary : colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: FONT_SIZE.sm,
                fontWeight: '600',
                color: portionMultiplier === p ? colors.card : colors.textSecondary,
              }}
            >
              {p}x
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
