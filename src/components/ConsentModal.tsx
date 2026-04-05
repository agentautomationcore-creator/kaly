import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../lib/theme';
import { Modal } from './Modal';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../lib/constants';

const PRIVACY_URL = 'https://kaly.app/privacy';

interface ConsentModalProps {
  visible: boolean;
  type: 'ai' | 'health';
  onAccept: () => void;
  onDecline: () => void;
}

function BulletPoint({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, marginEnd: SPACING.sm, lineHeight: 20 }}>{'\u2022'}</Text>
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, lineHeight: 20, flex: 1 }}>{text}</Text>
    </View>
  );
}

export function ConsentModal({ visible, type, onAccept, onDecline }: ConsentModalProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const isAi = type === 'ai';
  const title = isAi ? t('consent.ai_title') : t('consent.health_title');

  return (
    <Modal visible={visible} onClose={onDecline}>
      <View style={{ padding: SPACING.xl }}>
        <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: SPACING.lg }}>
          {title}
        </Text>

        {isAi ? (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: SPACING.sm }}>
              {t('consent.ai_what')}
            </Text>
            <BulletPoint text={t('consent.ai_bullet_1')} colors={colors} />
            <BulletPoint text={t('consent.ai_bullet_2')} colors={colors} />
            <BulletPoint text={t('consent.ai_bullet_3')} colors={colors} />
          </View>
        ) : (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: SPACING.sm }}>
              {t('consent.health_what')}
            </Text>
            <BulletPoint text={t('consent.health_bullet_1')} colors={colors} />
            <BulletPoint text={t('consent.health_bullet_2')} colors={colors} />
            <BulletPoint text={t('consent.health_bullet_3')} colors={colors} />
          </View>
        )}

        <Pressable
          onPress={() => Linking.openURL(PRIVACY_URL)}
          style={{ minHeight: MIN_TOUCH , justifyContent: 'center', marginBottom: SPACING.lg }}
          accessibilityRole="link"
          accessibilityLabel={t('consent.read_privacy')}
        >
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, textDecorationLine: 'underline' }}>
            {t('consent.read_privacy')}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <Pressable
            onPress={onDecline}
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.textTertiary, borderRadius: RADIUS.md, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg }}
            accessibilityRole="button"
            accessibilityLabel={t('consent.decline')}
          >
            <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, fontWeight: '600' }}>
              {t('consent.decline')}
            </Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            style={{ flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: RADIUS.md, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg }}
            accessibilityRole="button"
            accessibilityLabel={t('consent.accept')}
          >
            <Text style={{ fontSize: FONT_SIZE.md, color: colors.primary, fontWeight: '600' }}>
              {t('consent.accept')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
