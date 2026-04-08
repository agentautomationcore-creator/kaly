import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../lib/theme';
import { Modal } from './Modal';
import { FONT_SIZE, RADIUS, MIN_TOUCH, SPACING } from '../lib/constants';

const PRIVACY_URL = 'https://kaly.app/privacy';

interface ConsentModalProps {
  visible: boolean;
  type: 'ai' | 'health' | 'scan';
  onAccept: () => void;
  onDecline: () => void;
  /** For type='scan': pre-check health if already given */
  healthAlreadyGiven?: boolean;
  /** For type='scan': pre-check AI if already given */
  aiAlreadyGiven?: boolean;
}

function BulletPoint({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.primary, marginEnd: SPACING.sm, lineHeight: 20 }}>{'\u2022'}</Text>
      <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, lineHeight: 20, flex: 1 }}>{text}</Text>
    </View>
  );
}

function Checkbox({ checked, label, onToggle, colors }: { checked: boolean; label: string; onToggle: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, minHeight: MIN_TOUCH }}
    >
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={24}
        color={checked ? colors.primary : colors.textTertiary}
      />
      <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}

export function ConsentModal({ visible, type, onAccept, onDecline, healthAlreadyGiven, aiAlreadyGiven }: ConsentModalProps) {
  const { t } = useTranslation();
  const colors = useColors();

  const [healthChecked, setHealthChecked] = useState(healthAlreadyGiven ?? false);
  const [aiChecked, setAiChecked] = useState(aiAlreadyGiven ?? false);

  // Reset checkboxes when modal opens
  useEffect(() => {
    if (visible && type === 'scan') {
      setHealthChecked(healthAlreadyGiven ?? false);
      setAiChecked(aiAlreadyGiven ?? false);
    }
  }, [visible, type, healthAlreadyGiven, aiAlreadyGiven]);

  if (type === 'scan') {
    const canAccept = healthChecked && aiChecked;
    return (
      <Modal visible={visible} onClose={onDecline}>
        <View style={{ padding: SPACING.xl }}>
          <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: '700', color: colors.text, marginBottom: SPACING.lg }}>
            {t('consent.scan_title')}
          </Text>

          {/* Health Data Section */}
          <View style={{ marginBottom: SPACING.lg }}>
            <Checkbox
              checked={healthChecked}
              label={t('consent.scan_health_section')}
              onToggle={() => { if (!healthAlreadyGiven) setHealthChecked((v) => !v); }}
              colors={colors}
            />
            <View style={{ marginLeft: SPACING.xl + SPACING.sm, marginTop: SPACING.xs }}>
              <BulletPoint text={t('consent.health_bullet_1')} colors={colors} />
              <BulletPoint text={t('consent.health_bullet_2')} colors={colors} />
              <BulletPoint text={t('consent.health_bullet_3')} colors={colors} />
            </View>
          </View>

          {/* AI Analysis Section */}
          <View style={{ marginBottom: SPACING.lg }}>
            <Checkbox
              checked={aiChecked}
              label={t('consent.scan_ai_section')}
              onToggle={() => { if (!aiAlreadyGiven) setAiChecked((v) => !v); }}
              colors={colors}
            />
            <View style={{ marginLeft: SPACING.xl + SPACING.sm, marginTop: SPACING.xs }}>
              <BulletPoint text={t('consent.ai_bullet_1')} colors={colors} />
              <BulletPoint text={t('consent.ai_bullet_2')} colors={colors} />
              <BulletPoint text={t('consent.ai_bullet_3')} colors={colors} />
            </View>
          </View>

          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL)}
            style={{ minHeight: MIN_TOUCH, justifyContent: 'center', marginBottom: SPACING.lg }}
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
              disabled={!canAccept}
              style={{ flex: 1, borderWidth: 1.5, borderColor: canAccept ? colors.primary : colors.textTertiary, borderRadius: RADIUS.md, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, opacity: canAccept ? 1 : 0.5 }}
              accessibilityRole="button"
              accessibilityLabel={t('consent.accept_both')}
            >
              <Text style={{ fontSize: FONT_SIZE.md, color: canAccept ? colors.primary : colors.textTertiary, fontWeight: '600' }}>
                {t('consent.accept_both')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Original ai/health single-type modal (used in Settings)
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
          style={{ minHeight: MIN_TOUCH, justifyContent: 'center', marginBottom: SPACING.lg }}
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
