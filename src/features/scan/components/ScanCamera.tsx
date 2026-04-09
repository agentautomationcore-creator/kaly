import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { useAnalyzeFood } from '../hooks/useAnalyzeFood';
import { Button } from '../../../components/Button';
import * as Haptics from 'expo-haptics';
import { FONT_SIZE, RADIUS, SPACING } from '../../../lib/constants';

interface ScanCameraProps {
  usedToday?: number;
  plan?: string;
}

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

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl }}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.lg, marginBottom: SPACING.xl }}>
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
    isCapturing.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPhoto(photo.uri);
        analyze(photo.uri);
      }
    } finally {
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
      >
        <StatusBar barStyle="light-content" />
        {/* Overlay */}
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Close button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: insets.top + SPACING.sm, paddingHorizontal: SPACING.lg }}>
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/diary');
                }
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: RADIUS.full,
                backgroundColor: colors.overlay,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={24} color={colors.textOnPrimary} />
            </Pressable>
          </View>

          {/* Top hint */}
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: colors.overlay, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.full }}>
              <Text style={{ color: colors.card, fontSize: FONT_SIZE.sm, fontWeight: '500' }}>
                {t('scan.point_camera')}
              </Text>
            </View>
          </View>

          {/* Scan counter for free users */}
          {plan === 'free' && (
            <Text style={{ color: colors.textOnPrimary, fontSize: FONT_SIZE.sm, textAlign: 'center', marginBottom: SPACING.sm }}>
              {t('scan.scans_remaining', { remaining: Math.max(0, 3 - usedToday) })}
            </Text>
          )}

          {/* Bottom controls */}
          <View style={{ paddingBottom: 40, paddingHorizontal: SPACING.xl, gap: SPACING.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
              {/* Gallery */}
              <Pressable
                onPress={pickImage}
                accessibilityLabel={t('scan.choose_gallery')}
                accessibilityRole="button"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: RADIUS.xxl,
                  backgroundColor: colors.overlay,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="images" size={24} color={colors.card} />
              </Pressable>

              {/* Shutter */}
              <Pressable
                onPress={takePicture}
                disabled={isCapturing.current || isPending}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: RADIUS.full,
                  backgroundColor: colors.card,
                  borderWidth: 4,
                  borderColor: canScan ? colors.primary : colors.textSecondary,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: isPending || !canScan ? 0.4 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel={t('scan.take_photo')}
              >
                <View style={{ width: 56, height: 56, borderRadius: RADIUS.full, backgroundColor: colors.card }} />
              </Pressable>

              {/* Flip */}
              <Pressable
                onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
                accessibilityLabel={t('scan.flip_camera')}
                accessibilityRole="button"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: RADIUS.xxl,
                  backgroundColor: colors.overlay,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="camera-reverse" size={24} color={colors.card} />
              </Pressable>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
