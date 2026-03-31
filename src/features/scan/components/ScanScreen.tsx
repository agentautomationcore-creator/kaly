import React from 'react';
import { View } from 'react-native';
import { useColors } from '../../../lib/theme';
import { useScanStore } from '../store/scanStore';
import { ScanCamera } from './ScanCamera';
import { ScanLoading } from './ScanLoading';
import { NutritionResultCard } from './NutritionResultCard';

export function ScanScreen() {
  const colors = useColors();
  const { photo, result, isAnalyzing } = useScanStore();

  if (isAnalyzing) {
    return <ScanLoading />;
  }

  if (result) {
    return <NutritionResultCard />;
  }

  return <ScanCamera />;
}
