import React from 'react';
import { View, Text, Pressable, Modal as RNModal, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../lib/theme';
import { RADIUS, FONT_SIZE } from '../lib/constants';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Modal({ visible, onClose, title, children, style }: ModalProps) {
  const { t } = useTranslation();
  const colors = useColors();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.close_modal')}
      >
        <Pressable
          style={{
            backgroundColor: colors.card,
            borderRadius: RADIUS.xl,
            padding: 24,
            maxHeight: '80%',
            ...style,
          }}
          onPress={() => {}}
          accessibilityViewIsModal={true}
        >
          {/* X close button */}
          <Pressable
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel={t('common.close_modal')}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>

          {title ? (
            <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text, marginBottom: 16, paddingEnd: 40 }}>
              {title}
            </Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
