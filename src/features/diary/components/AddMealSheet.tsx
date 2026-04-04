import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { Modal } from '../../../components/Modal';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';

interface AddMealSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AddMealSheet({ visible, onClose }: AddMealSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();

  const options = [
    { icon: 'camera' as const, label: t('scan.take_photo'), action: () => { onClose(); router.push('/(tabs)/scan'); } },
    { icon: 'images' as const, label: t('scan.choose_gallery'), action: () => { onClose(); router.push('/(tabs)/scan'); } },
    { icon: 'barcode-outline' as const, label: t('barcode.scan_barcode'), action: () => { onClose(); router.push('/barcode'); } },
  ];

  return (
    <Modal visible={visible} onClose={onClose} title={t('diary.add_food')}>
      <View style={{ gap: 8 }}>
        {options.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={opt.action}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              minHeight: 44,
              borderRadius: RADIUS.md,
              backgroundColor: colors.surface,
            }}
          >
            <Ionicons name={opt.icon} size={24} color={colors.primary} />
            <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '500', color: colors.text }}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
