import React, { useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { useAnalyzeFood } from '../hooks/useAnalyzeFood';
import { Button } from '../../../components/Button';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';

export function ScanCamera() {
  const { t } = useTranslation();
  const colors = useColors();
  const cameraRef = useRef<CameraView>(null);
  const isCapturing = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { setPhoto } = useScanStore();
  const { mutate: analyze, isPending } = useAnalyzeFood();
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={{ fontSize: FONT_SIZE.md, color: colors.textSecondary, textAlign: 'center', marginTop: 16, marginBottom: 24 }}>
          {t('errors.no_camera')}
        </Text>
        <Button title="Grant camera access" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing.current || isPending) return;
    isCapturing.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPhoto(photo.uri);
        analyze(photo.uri);
      }
    } finally {
      isCapturing.current = false;
    }
  };

  const pickImage = async () => {
    if (isCapturing.current || isPending) return;
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
        {/* Overlay */}
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          {/* Top hint */}
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full }}>
              <Text style={{ color: '#FFF', fontSize: FONT_SIZE.sm, fontWeight: '500' }}>
                {t('scan.point_camera')}
              </Text>
            </View>
          </View>

          {/* Bottom controls */}
          <View style={{ paddingBottom: 40, paddingHorizontal: 24, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
              {/* Gallery */}
              <Pressable
                onPress={pickImage}
                accessibilityLabel={t('scan.choose_gallery')}
                accessibilityRole="button"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="images" size={24} color="#FFF" />
              </Pressable>

              {/* Shutter */}
              <Pressable
                onPress={takePicture}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#FFF',
                  borderWidth: 4,
                  borderColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel={t('scan.take_photo')}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF' }} />
              </Pressable>

              {/* Flip */}
              <Pressable
                onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
                accessibilityLabel="Flip camera"
                accessibilityRole="button"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="camera-reverse" size={24} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
