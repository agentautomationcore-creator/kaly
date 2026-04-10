import React, { useCallback, useEffect } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useColors } from '../lib/theme';
import { RADIUS } from '../lib/constants';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: number[];
  children: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  snapPoints = [0.4, 0.75, 0.95],
  children,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);
  const initialSnap = snapPoints[0] * screenHeight;

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(screenHeight - initialSnap, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(screenHeight, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, screenHeight, initialSnap, translateY, backdropOpacity]);

  const close = useCallback(() => onClose(), [onClose]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newY = screenHeight - initialSnap + e.translationY;
      if (newY >= 0) {
        translateY.value = newY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        translateY.value = withTiming(screenHeight, { duration: 300 });
        backdropOpacity.value = withTiming(0, { duration: 300 });
        runOnJS(close)();
      } else {
        // Snap to nearest point
        const currentHeight = screenHeight - translateY.value;
        let nearest = snapPoints[0];
        let minDist = Math.abs(currentHeight - snapPoints[0] * screenHeight);
        for (const sp of snapPoints) {
          const dist = Math.abs(currentHeight - sp * screenHeight);
          if (dist < minDist) {
            minDist = dist;
            nearest = sp;
          }
        }
        translateY.value = withTiming(screenHeight - nearest * screenHeight, { duration: 300 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              height: screenHeight,
              backgroundColor: colors.surfaceElevated,
              borderTopLeftRadius: RADIUS.xl,
              borderTopRightRadius: RADIUS.xl,
            },
            sheetStyle,
          ]}
        >
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: RADIUS.full,
                backgroundColor: colors.border,
              }}
            />
          </View>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
