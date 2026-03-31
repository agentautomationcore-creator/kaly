import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../lib/theme';
import { Modal } from './Modal';
import { Button } from './Button';
import { FONT_SIZE, RADIUS } from '../lib/constants';

const PRIVACY_URL = 'https://kaly.app/privacy';

interface ConsentModalProps {
  visible: boolean;
  type: 'ai' | 'health';
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ visible, type, onAccept, onDecline }: ConsentModalProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const title = type === 'ai' ? t('consent.ai_title') : t('consent.health_title');
  const body = type === 'ai' ? t('consent.ai_body') : t('consent.health_body');

  return (
    <Modal visible={visible} onClose={onDecline}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
          {title}
        </Text>
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 }}>
          {body}
        </Text>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Text style={{ fontSize: FONT_SIZE.xs, color: colors.primary, marginBottom: 20 }}>
            {t('consent.read_privacy')}
          </Text>
        </Pressable>
        <Button title={t('consent.accept')} onPress={onAccept} />
        <Pressable onPress={onDecline} style={{ alignItems: 'center', marginTop: 12 }}>
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary }}>
            {t('consent.decline')}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
