import React from 'react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { BarcodeScanner } from '../src/features/barcode/components/BarcodeScanner';

export default function BarcodeScreen() {
  return (
    <ErrorBoundary featureName="barcode">
      <BarcodeScanner />
    </ErrorBoundary>
  );
}
