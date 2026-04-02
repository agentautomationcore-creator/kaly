import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import i18n from '../i18n';
import { lightColors, darkColors, type Colors } from '../lib/theme';
import { useSettingsStore } from '../stores/settingsStore';
import { captureException } from '../lib/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function getColors(): Colors {
  try {
    const theme = useSettingsStore.getState().effectiveTheme;
    return theme === 'dark' ? darkColors : lightColors;
  } catch {
    return lightColors;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error(`[ErrorBoundary:${this.props.featureName || 'unknown'}]`, error, errorInfo);
    }
    captureException(error, { feature: this.props.featureName || 'unknown', componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const colors = getColors();

      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 }}>
            {i18n.t('errors.generic')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error?.message || i18n.t('errors.generic')}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('common.retry')}
          >
            <Text style={{ color: colors.card, fontWeight: '600', fontSize: 15 }}>{i18n.t('common.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
