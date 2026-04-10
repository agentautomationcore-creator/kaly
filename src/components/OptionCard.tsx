import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../lib/theme';
import { RADIUS, SPACING } from '../lib/constants';
import { typography } from '../lib/typography';

interface OptionCardProps {
  icon: string;
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function OptionCard({ icon, title, description, selected, onPress }: OptionCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 72,
        padding: SPACING[4],
        gap: 14,
        borderRadius: RADIUS.lg,
        backgroundColor: selected ? colors.primarySubtle : colors.bg,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.border,
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
    >
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.bodyMedium, color: colors.textPrimary }}>{title}</Text>
        {description ? (
          <Text style={{ ...typography.small, color: colors.textSecondary, marginTop: 2 }}>{description}</Text>
        ) : null}
      </View>
      {selected && (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={16} color={colors.textInverse} />
        </View>
      )}
    </Pressable>
  );
}
