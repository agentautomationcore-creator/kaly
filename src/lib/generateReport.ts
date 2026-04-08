import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { supabase, withTimeout } from './supabase';
import { lightColors } from './theme';
import i18n from '../i18n';
import { formatNumber } from './formatNumber';

/** Escape user/external data before inserting into HTML template */
const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Locale mapping for toLocaleDateString (i18n codes → BCP 47)
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ru: 'ru-RU',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  ar: 'ar-SA',
  pt: 'pt-BR',
  tr: 'tr-TR',
  zh: 'zh-CN',
};

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
}

interface ReportData {
  startDate: string;
  endDate: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  totalWaterMl: number;
  weightStart: number | null;
  weightEnd: number | null;
  daysTracked: number;
  dailyData: DayData[];
}

function getLocaleTag(): string {
  return LOCALE_MAP[i18n.language] || 'en-US';
}

async function fetchReportData(days: number): Promise<ReportData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  // Parallel fetch with timeout
  const [diaryRes, waterRes, weightRes] = await withTimeout(
    Promise.all([
      supabase
        .from('diary_entries')
        .select('created_at, total_calories, total_protein, total_carbs, total_fat')
        .eq('user_id', user.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at'),
      supabase
        .from('water_log')
        .select('created_at, ml')
        .eq('user_id', user.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO),
      supabase
        .from('weight_log')
        .select('created_at, weight_kg')
        .eq('user_id', user.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at'),
    ]),
    15000,
    'report-fetch',
  );

  const diary = diaryRes.data || [];
  const water = waterRes.data || [];
  const weights = weightRes.data || [];

  // Build day map
  const dayMap = new Map<string, DayData>();
  for (let d = 0; d < days; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const key = date.toISOString().split('T')[0];
    dayMap.set(key, { date: key, calories: 0, protein: 0, carbs: 0, fat: 0, waterMl: 0 });
  }

  for (const entry of diary) {
    const key = new Date(entry.created_at).toISOString().split('T')[0];
    const day = dayMap.get(key);
    if (day) {
      day.calories += entry.total_calories || 0;
      day.protein += entry.total_protein || 0;
      day.carbs += entry.total_carbs || 0;
      day.fat += entry.total_fat || 0;
    }
  }

  for (const entry of water) {
    const key = new Date(entry.created_at).toISOString().split('T')[0];
    const day = dayMap.get(key);
    if (day) day.waterMl += entry.ml || 0;
  }

  const dailyData = Array.from(dayMap.values());
  const daysWithData = dailyData.filter(d => d.calories > 0);
  const totalDays = daysWithData.length || 1;

  const locale = getLocaleTag();

  return {
    startDate: startDate.toLocaleDateString(locale),
    endDate: endDate.toLocaleDateString(locale),
    avgCalories: Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / totalDays),
    avgProtein: Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / totalDays),
    avgCarbs: Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / totalDays),
    avgFat: Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / totalDays),
    totalWaterMl: water.reduce((s, w) => s + (w.ml || 0), 0),
    weightStart: weights[0]?.weight_kg ?? null,
    weightEnd: weights[weights.length - 1]?.weight_kg ?? null,
    daysTracked: totalDays,
    dailyData,
  };
}

function generateHTML(data: ReportData): string {
  const t = (key: string) => i18n.t(key);
  const c = lightColors;

  const uG = t('units.g');
  const uMl = t('common.ml');
  const uKg = t('units.kg');

  const dailyRows = data.dailyData
    .map(d => `
      <tr>
        <td>${escapeHtml(d.date)}</td>
        <td>${formatNumber(d.calories)}</td>
        <td>${formatNumber(d.protein)}${escapeHtml(uG)}</td>
        <td>${formatNumber(d.carbs)}${escapeHtml(uG)}</td>
        <td>${formatNumber(d.fat)}${escapeHtml(uG)}</td>
        <td>${formatNumber(d.waterMl)}${escapeHtml(uMl)}</td>
      </tr>
    `).join('');

  const weightSection = data.weightStart != null && data.weightEnd != null
    ? `<tr>
        <td colspan="6" style="background: ${c.primaryLight}; padding: 12px; font-size: 13px;">
          <strong>${escapeHtml(t('report.weight'))}:</strong> ${data.weightStart} ${escapeHtml(uKg)} &rarr; ${data.weightEnd} ${escapeHtml(uKg)}
          (${data.weightEnd - data.weightStart > 0 ? '+' : ''}${(data.weightEnd - data.weightStart).toFixed(1)} ${escapeHtml(uKg)})
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 40px; color: ${c.text}; font-size: 12px; }
    h1 { color: ${c.primary}; font-size: 24px; margin-bottom: 4px; }
    h2 { color: ${c.text}; font-size: 16px; margin-top: 24px; border-bottom: 2px solid ${c.primary}; padding-bottom: 4px; }
    .subtitle { color: ${c.textSecondary}; font-size: 14px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: ${c.primary}; color: ${c.background}; padding: 8px; text-align: left; font-size: 11px; }
    td { padding: 6px 8px; border-bottom: 1px solid ${c.border}; font-size: 11px; }
    tr:nth-child(even) { background: ${c.surface}; }
    .summary-table td { padding: 12px 16px; text-align: center; background: ${c.surface}; border: 4px solid ${c.background}; }
    .stat-value { font-size: 20px; font-weight: 700; color: ${c.primary}; display: block; }
    .stat-label { font-size: 10px; color: ${c.textSecondary}; text-transform: uppercase; margin-top: 4px; display: block; }
    .footer { margin-top: 32px; text-align: center; color: ${c.textTertiary}; font-size: 10px; }
  </style>
</head>
<body>
  <h1>Kaly -- ${escapeHtml(t('report.title'))}</h1>
  <p class="subtitle">${escapeHtml(data.startDate)} - ${escapeHtml(data.endDate)} (${data.daysTracked} ${escapeHtml(t('report.days_tracked'))})</p>

  <h2>${escapeHtml(t('report.summary'))}</h2>
  <table class="summary-table">
    <tr>
      <td>
        <span class="stat-value">${formatNumber(data.avgCalories)}</span>
        <span class="stat-label">${escapeHtml(t('report.avg_calories'))}</span>
      </td>
      <td>
        <span class="stat-value">${formatNumber(data.avgProtein)}${escapeHtml(uG)}</span>
        <span class="stat-label">${escapeHtml(t('report.avg_protein'))}</span>
      </td>
      <td>
        <span class="stat-value">${formatNumber(data.avgCarbs)}${escapeHtml(uG)}</span>
        <span class="stat-label">${escapeHtml(t('report.avg_carbs'))}</span>
      </td>
      <td>
        <span class="stat-value">${formatNumber(data.avgFat)}${escapeHtml(uG)}</span>
        <span class="stat-label">${escapeHtml(t('report.avg_fat'))}</span>
      </td>
    </tr>
  </table>

  ${weightSection}

  <h2>${escapeHtml(t('report.daily_breakdown'))}</h2>
  <table>
    <tr>
      <th>${escapeHtml(t('report.date'))}</th>
      <th>${escapeHtml(t('report.calories'))}</th>
      <th>${escapeHtml(t('report.protein'))}</th>
      <th>${escapeHtml(t('report.carbs'))}</th>
      <th>${escapeHtml(t('report.fat'))}</th>
      <th>${escapeHtml(t('report.water'))}</th>
    </tr>
    ${dailyRows}
  </table>

  <p class="footer">${escapeHtml(t('report.generated_by'))} Kaly -- ${escapeHtml(new Date().toLocaleDateString(getLocaleTag()))}</p>
</body>
</html>`;
}

export async function exportReport(days: number = 7): Promise<void> {
  const data = await fetchReportData(days);

  // Check for empty data
  if (data.daysTracked === 0 || data.dailyData.every(d => d.calories === 0)) {
    Alert.alert(i18n.t('common.info'), i18n.t('report.no_data'));
    return;
  }

  const html = generateHTML(data);
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: i18n.t('report.share_title'),
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert(i18n.t('common.error'), i18n.t('export.sharing_unavailable'));
  }
}
