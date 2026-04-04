import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../lib/theme';
import { Modal } from './Modal';
import { Button } from './Button';
import { FONT_SIZE, RADIUS, MIN_TOUCH } from '../lib/constants';

const PRIVACY_URL = 'https://kaly.app/privacy';

interface ConsentModalProps {
  visible: boolean;
  type: 'ai' | 'health';
  onAccept: () => void;
  onDecline: () => void;
}

function BulletPoint({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, marginEnd: 8, lineHeight: 20 }}>{'\u2022'}</Text>
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
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
          {title}
        </Text>

        {isAi ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              {t('consent.ai_what')}
            </Text>
            <BulletPoint text={t('consent.ai_bullet_1')} colors={colors} />
            <BulletPoint text={t('consent.ai_bullet_2')} colors={colors} />
            <BulletPoint text={t('consent.ai_bullet_3')} colors={colors} />
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
              {t('consent.health_what')}
            </Text>
            <BulletPoint text={t('consent.health_bullet_1')} colors={colors} />
            <BulletPoint text={t('consent.health_bullet_2')} colors={colors} />
            <BulletPoint text={t('consent.health_bullet_3')} colors={colors} />
          </View>
        )}

        <Pressable
          onPress={() => Linking.openURL(PRIVACY_URL)}
          style={{ minHeight: MIN_TOUCH , justifyContent: 'center', marginBottom: 16 }}
          accessibilityRole="link"
          accessibilityLabel={t('consent.read_privacy')}
        >
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, textDecorationLine: 'underline' }}>
            {t('consent.read_privacy')}
          </Text>
        </Pressable>

        <Button title={t('consent.accept')} onPress={onAccept} />
        <Pressable
          onPress={onDecline}
          style={{ alignItems: 'center', marginTop: 12, minHeight: MIN_TOUCH, justifyContent: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('consent.decline')}
        >
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
            {t('consent.decline')}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
