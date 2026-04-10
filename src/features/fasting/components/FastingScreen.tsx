import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, AppState } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useColors } from '../../../lib/theme';
import { useFastingStore } from '../../../stores/fastingStore';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Button } from '../../../components/Button';
import { FastingRing } from './FastingRing';
import { FastingPhases } from './FastingPhases';
import { SPACING } from '../../../lib/constants';
import { typography } from '../../../lib/typography';

const PROTOCOLS = [
  { label: '16:8', fasting: 16, eating: 8 },
  { label: '18:6', fasting: 18, eating: 6 },
  { label: '20:4', fasting: 20, eating: 4 },
];

export function FastingScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { isActive, startTime, targetHours, start, stop, setTargetHours } = useFastingStore();
  const [elapsed, setElapsed] = useState(0);
  const [tick, setTick] = useState(0);
  const completionFired = useRef(false);

  const protocolIndex = PROTOCOLS.findIndex((p) => p.fasting === targetHours);
  const activeProtocol = protocolIndex >= 0 ? protocolIndex : 0;

  // Recalculate elapsed when app resumes from background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && startTime) setTick((prev) => prev + 1);
    });
    return () => sub.remove();
  }, [startTime]);

  // Timer tick every second
  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, startTime, tick]);

  const targetSeconds = targetHours * 3600;
  const completed = elapsed >= targetSeconds;
  const elapsedHours = elapsed / 3600;

  // Completion haptic + notification
  useEffect(() => {
    if (completed && !completionFired.current) {
      completionFired.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Notifications.scheduleNotificationAsync({
        content: { title: t('fasting.complete_title'), body: t('fasting.complete_body') },
        trigger: null,
      }).catch(() => {});
    }
    if (!isActive) completionFired.current = false;
  }, [completed, isActive, t]);

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isActive) {
      stop();
    } else {
      start(targetHours);
    }
  }, [isActive, targetHours, start, stop]);

  const handleProtocolChange = (index: number) => {
    if (isActive) return;
    setTargetHours(PROTOCOLS[index].fasting);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: SPACING[4], paddingBottom: 100 }}
    >
      <Text style={{ ...typography.title, color: colors.textPrimary, marginBottom: SPACING[6] }}>
        {t('fasting.title')}
      </Text>

      {/* Protocol selector */}
      {!isActive && (
        <View style={{ marginBottom: SPACING[6] }}>
          <SegmentedControl
            items={PROTOCOLS.map((p) => p.label)}
            activeIndex={activeProtocol}
            onChange={handleProtocolChange}
          />
        </View>
      )}

      {/* Ring */}
      <View style={{ alignItems: 'center', marginBottom: SPACING[6] }}>
        <FastingRing elapsed={elapsed} targetSeconds={targetSeconds} />
        {completed && (
          <Text style={{ ...typography.bodyMedium, color: colors.success, marginTop: SPACING[3] }}>
            {t('fasting.completed')}
          </Text>
        )}
      </View>

      {/* Phases timeline */}
      {isActive && (
        <View style={{ marginBottom: SPACING[6] }}>
          <FastingPhases elapsedHours={elapsedHours} targetHours={targetHours} />
        </View>
      )}

      {/* Start / End button */}
      <Button
        title={isActive ? `\u23F8 ${t('fasting.stop')}` : `${t('fasting.start')} \u2192`}
        variant={isActive ? 'secondary' : 'primary'}
        onPress={handleToggle}
      />
    </ScrollView>
  );
}
