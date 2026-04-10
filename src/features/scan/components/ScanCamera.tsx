import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { useAnalyzeFood } from '../hooks/useAnalyzeFood';
import { Button } from '../../../components/Button';
import * as Haptics from 'expo-haptics';
import { RADIUS, SPACING, MIN_TOUCH } from '../../../lib/constants';
import { typography } from '../../../lib/typography';

interface ScanCameraProps {
  usedToday?: number;
  plan?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScanCamera({ usedToday = 0, plan = 'free' }: ScanCameraProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const isCapturing = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { setPhoto } = useScanStore();
  const { mutate: analyze, isPending } = useAnalyzeFood();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const canScan = plan !== 'free' || usedToday < 3;
  const remaining = Math.max(0, 3 - usedToday);
  const shutterScale = useSharedValue(1);

  const shutterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING[6] }}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING[4], marginBottom: SPACING[6] }}>
          {t('errors.no_camera')}
        </Text>
        <Button title={t('scan.grant_camera')} onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing.current || isPending) return;
    if (!canScan) {
      router.push('/paywall');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shutterScale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
    isCapturing.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPhoto(photo.uri);
        analyze(photo.uri);
      }
    } finally {
      shutterScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      setTimeout(() => { isCapturing.current = false; }, 1000);
    }
  };

  const pickImage = async () => {
    if (isCapturing.current || isPending) return;
    if (!canScan) {
      router.push('/paywall');
      return;
    }
    isCapturing.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        analyze(result.assets[0].uri);
      }
    } finally {
      isCapturing.current = false;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        <StatusBar barStyle="light-content" />
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Top bar — close */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingTop: insets.top + 8, paddingHorizontal: SPACING[4] }}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace('/(tabs)/diary');
              }}
              style={{
                width: MIN_TOUCH,
                height: MIN_TOUCH,
                borderRadius: RADIUS.full,
                backgroundColor: 'rgba(0,0,0,0.5)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Corner brackets overlay */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 240, height: 240, position: 'relative' }}>
              {/* Top-left */}
              <View style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 3, borderLeftWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }} />
              {/* Top-right */}
              <View style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 3, borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }} />
              {/* Bottom-left */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }} />
              {/* Bottom-right */}
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 3, borderRightWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }} />
            </View>
          </View>

          {/* Scan counter for free */}
          {plan === 'free' && (
            <View style={{
              alignSelf: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: RADIUS.lg,
              paddingVertical: 8,
              paddingHorizontal: 16,
              marginBottom: 8,
            }}>
              <Text style={{ ...typography.small, color: '#fff' }}>
                {'\uD83D\uDD2E'} {t('scan.scans_remaining', { remaining })}
              </Text>
            </View>
          )}

          {/* Bottom controls */}
          <View style={{ paddingBottom: insets.bottom + 20, paddingHorizontal: SPACING[6] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
              {/* Gallery */}
              <Pressable
                onPress={pickImage}
                accessibilityLabel={t('scan.choose_gallery')}
                accessibilityRole="button"
                style={{
                  width: MIN_TOUCH,
                  height: MIN_TOUCH,
                  borderRadius: RADIUS.full,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="images" size={22} color="#fff" />
              </Pressable>

              {/* Shutter */}
              <AnimatedPressable
                onPress={takePicture}
                disabled={isCapturing.current || isPending}
                style={[
                  {
                    width: 72,
                    height: 72,
                    borderRadius: RADIUS.full,
                    borderWidth: 4,
                    borderColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: isPending || !canScan ? 0.4 : 1,
                  },
                  shutterAnimStyle,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('scan.take_photo')}
              >
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' }} />
              </AnimatedPressable>

              {/* Barcode */}
              <Pressable
                onPress={() => router.push('/barcode')}
                accessibilityLabel={t('barcode.scan_barcode')}
                accessibilityRole="button"
                style={{
                  width: MIN_TOUCH,
                  height: MIN_TOUCH,
                  borderRadius: RADIUS.full,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="barcode-outline" size={22} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
