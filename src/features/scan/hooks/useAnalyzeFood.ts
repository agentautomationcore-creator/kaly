import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { compressImage } from '../../../lib/imageUtils';
import { useScanStore } from '../store/scanStore';
import { useAuthStore } from '../../../stores/authStore';
import { captureException } from '../../../lib/sentry';
import { track } from '../../../lib/analytics';
import type { ScanResult } from '../types';
import i18n from '../../../i18n';

const ANALYZE_TIMEOUT_MS = 30_000;

/** Validate AI output ranges to prevent cache poisoning */
function validateScanResult(result: ScanResult): ScanResult {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  result.total.calories = clamp(result.total.calories, 0, 10000);
  result.total.protein_g = clamp(result.total.protein_g, 0, 1000);
  result.total.fat_g = clamp(result.total.fat_g, 0, 1000);
  result.total.carbs_g = clamp(result.total.carbs_g, 0, 1000);
  result.total.fiber_g = clamp(result.total.fiber_g, 0, 200);
  for (const item of result.items) {
    item.calories = clamp(item.calories, 0, 10000);
    item.protein_g = clamp(item.protein_g, 0, 1000);
    item.fat_g = clamp(item.fat_g, 0, 1000);
    item.carbs_g = clamp(item.carbs_g, 0, 1000);
    item.fiber_g = clamp(item.fiber_g, 0, 200);
    item.g = clamp(item.g, 0, 5000);
  }
  result.confidence = clamp(result.confidence, 0, 1);
  return result;
}

let activeAbortController: AbortController | null = null;

async function makeAnalyzeRequest(
  body: Record<string, unknown>,
  controller: AbortController,
): Promise<ScanResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const makeRequest = async (token: string) => fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-food`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...body, language: i18n.language }),
      signal: controller.signal,
    }
  );

  let response = await makeRequest(session.access_token);

  // AUTH-3: Retry once on 401 with refreshed token
  if (response.status === 401) {
    const refreshed = await useAuthStore.getState().refreshAndRetry();
    if (refreshed) {
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession) {
        response = await makeRequest(newSession.access_token);
      }
    }
  }

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

  return validateScanResult(result);
}

async function analyzeFood(photoUri: string): Promise<ScanResult> {
  // Cancel any previous in-flight request
  if (activeAbortController) {
    activeAbortController.abort();
  }
  const controller = new AbortController();
  activeAbortController = controller;
  const timeout = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  try {
    const base64 = await compressImage(photoUri);
    return await makeAnalyzeRequest({ image: base64 }, controller);
  } finally {
    clearTimeout(timeout);
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}

async function analyzeText(text: string): Promise<ScanResult> {
  if (activeAbortController) {
    activeAbortController.abort();
  }
  const controller = new AbortController();
  activeAbortController = controller;
  const timeout = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

  try {
    return await makeAnalyzeRequest({ text, type: 'text' }, controller);
  } finally {
    clearTimeout(timeout);
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}

/** Cancel the current analysis request */
export function cancelAnalysis() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

export function useAnalyzeFood() {
  const { setResult, setAnalyzing, setError } = useScanStore();

  return useMutation({
    mutationFn: analyzeFood,
    onMutate: () => {
      setAnalyzing(true);
      setError(null);
      track('scan_food');
    },
    onSuccess: (data) => {
      setResult(data);
      track('scan_result', { confidence: data.confidence, items_count: data.items.length });
    },
    onError: (error: Error) => {
      setError(error.message);
      if (error.message !== 'NOT_FOOD' && error.message !== 'RATE_LIMIT') {
        captureException(error, { feature: 'analyze_food' });
      }
    },
  });
}

export function useAnalyzeText() {
  const { setResult, setAnalyzing, setError } = useScanStore();

  return useMutation({
    mutationFn: analyzeText,
    onMutate: () => {
      setAnalyzing(true);
      setError(null);
      track('analyze_text');
    },
    onSuccess: (data) => {
      setResult(data);
      track('text_result', { confidence: data.confidence, items_count: data.items.length });
    },
    onError: (error: Error) => {
      setError(error.message);
      if (error.message !== 'NOT_FOOD' && error.message !== 'RATE_LIMIT') {
        captureException(error, { feature: 'analyze_text' });
      }
    },
  });
}
