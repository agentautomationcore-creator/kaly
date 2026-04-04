import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, Linking, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../../../lib/theme';
import { Button } from '../../../components/Button';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import { lookupBarcode, type BarcodeProduct } from '../hooks/useBarcodeLookup';
import { BarcodeResult } from './BarcodeResult';
import { track } from '../../../lib/analytics';

export function BarcodeScanner() {
  const { t } = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const lastScanned = useRef<string>('');

  const handleBarcode = useCallback(async (result: { data: string }) => {
    if (!scanning || loading) return;
    if (result.data === lastScanned.current) return;
    lastScanned.current = result.data;
    setScanning(false);
    setLoading(true);

    const found = await lookupBarcode(result.data);
    setLoading(false);

    if (found) {
      setProduct(found);
      AccessibilityInfo.announceForAccessibility(t('barcode.scan_success'));
      track('scan_food', { method: 'barcode' });
    } else {
      Alert.alert(
        t('barcode.not_found'),
        t('barcode.not_found_desc'),
        [
          { text: t('barcode.scan_again'), onPress: () => { setScanning(true); lastScanned.current = ''; } },
          { text: t('barcode.enter_manually'), onPress: () => {
            // Set a manual entry product with the scanned barcode
            setProduct({
              barcode: result.data,
              name: '',
              calories100g: 0,
              protein100g: 0,
              fat100g: 0,
              carbs100g: 0,
              source: 'manual',
            });
          }},
        ]
      );
    }
  }, [scanning, loading, t]);

  if (product) {
    return (
      <BarcodeResult
        product={product}
        onDone={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/diary'); }}
        onScanAgain={() => { setProduct(null); setScanning(true); lastScanned.current = ''; }}
      />
    );
  }

  if (!permission?.granted) {
    const canAsk = permission?.canAskAgain !== false;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="barcode-outline" size={48} color={colors.textSecondary} />
        <Text style={{ fontSize: FONT_SIZE.md, color: colors.text, textAlign: 'center', marginVertical: 16 }}>
          {t('barcode.camera_needed')}
        </Text>
        {canAsk ? (
          <Button title={t('scan.grant_camera')} onPress={requestPermission} />
        ) : (
          <Button title={t('scan.open_settings')} onPress={() => Linking.openSettings()} />
        )}
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/diary'); }} style={{ marginTop: 16, minHeight: 44, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
          <Text style={{ color: colors.textSecondary }}>{t('common.cancel')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
        onBarcodeScanned={scanning ? handleBarcode : undefined}
      />

      {/* Overlay */}
      <View style={{ position: 'absolute', top: 0, start: 0, end: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        {/* Scanning frame */}
        <View style={{ width: 260, height: 160, borderWidth: 2, borderColor: '#fff', borderRadius: 12, opacity: 0.7 }} accessibilityLabel={t('barcode.point_at_barcode')} />
        <Text style={{ color: '#fff', fontSize: FONT_SIZE.sm, marginTop: 16, opacity: 0.8 }}>
          {t('barcode.point_at_barcode')}
        </Text>

        {loading && (
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#fff" />
            <Text style={{ color: '#fff', fontSize: FONT_SIZE.sm }}>{t('common.loading')}</Text>
          </View>
        )}
      </View>

      {/* Close button */}
      <SafeAreaView style={{ position: 'absolute', top: 0, start: 0, end: 0 }} edges={['top']}>
        <Pressable
          onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/diary'); }}
          style={{ alignSelf: 'flex-end', margin: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}
