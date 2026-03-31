import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { compressImage } from '../../../lib/imageUtils';
import { useScanStore } from '../store/scanStore';
import type { ScanResult } from '../types';
import i18n from '../../../i18n';

async function analyzeFood(photoUri: string): Promise<ScanResult> {
  const base64 = await compressImage(photoUri);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-food`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        image: base64,
        language: i18n.language,
      }),
    }
  );

  if (response.status === 429) {
    const data = await response.json();
    const err = new Error('RATE_LIMIT') as Error & { limit?: number; remaining?: number };
    err.limit = data.limit;
    err.remaining = data.remaining;
    throw err;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Analysis failed');
  }

  const result = await response.json();
  if (result.error === 'not_food') {
    throw new Error('NOT_FOOD');
  }

  return result;
}

export function useAnalyzeFood() {
  const { setResult, setAnalyzing, setError } = useScanStore();

  return useMutation({
    mutationFn: analyzeFood,
    onMutate: () => {
      setAnalyzing(true);
      setError(null);
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });
}
