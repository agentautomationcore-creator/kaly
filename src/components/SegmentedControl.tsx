import React from 'react';
import { View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColors } from '../lib/theme';
import { RADIUS } from '../lib/constants';
import { typography } from '../lib/typography';

interface SegmentedControlProps {
  items: string[];
  activeIndex: number;
  onChange: (index: number) => void;
}

export function SegmentedControl({ items, activeIndex, onChange }: SegmentedControlProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const itemWidth = useSharedValue(0);
  const indicatorX = useSharedValue(0);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const w = (e.nativeEvent.layout.width - 6) / items.length;
    itemWidth.value = w;
    indicatorX.value = withSpring(3 + activeIndex * w, { damping: 15, stiffness: 180 });
  };

  React.useEffect(() => {
    if (itemWidth.value > 0) {
      indicatorX.value = withSpring(3 + activeIndex * itemWidth.value, { damping: 15, stiffness: 180 });
    }
  }, [activeIndex, itemWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: itemWidth.value,
  }));

  return (
    <View
      onLayout={onContainerLayout}
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: RADIUS.full,
        padding: 3,
        position: 'relative',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 3,
            bottom: 3,
            borderRadius: RADIUS.full,
            backgroundColor: colors.primary,
          },
          indicatorStyle,
        ]}
      />
      {items.map((label, i) => (
        <Pressable
          key={label}
          onPress={() => onChange(i)}
          style={{
            flex: 1,
            minHeight: 44,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: RADIUS.full,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === activeIndex }}
          accessibilityLabel={label}
          accessibilityHint={t('hints.switch_period')}
        >
          <Text
            style={{
              ...typography.smallMedium,
              color: i === activeIndex ? colors.textInverse : colors.textSecondary,
            }}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
