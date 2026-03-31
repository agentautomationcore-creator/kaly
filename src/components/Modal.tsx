import React from 'react';
import { View, Text, Pressable, Modal as RNModal, ViewStyle } from 'react-native';
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
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}
        onPress={onClose}
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
        >
          {title ? (
            <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
              {title}
            </Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
