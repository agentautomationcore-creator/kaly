import { Platform } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';

// Lazy import to avoid crash on Android
let AppleHealthKit: any = null;
if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch {
    // Not available (Expo Go or Android)
  }
}

const permissions = {
  permissions: {
    read: ['StepCount', 'ActiveEnergyBurned'],
    write: ['DietaryEnergyConsumed', 'Water', 'BodyMass'],
  },
};

export function useHealthKit() {
  const isAvailable = Platform.OS === 'ios' && AppleHealthKit != null;
  const healthKitEnabled = useSettingsStore((s) => s.healthKitEnabled);

  const init = (): Promise<boolean> => {
    if (!isAvailable) return Promise.resolve(false);

    return new Promise((resolve) => {
      const perms = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.EnergyConsumed,
            AppleHealthKit.Constants.Permissions.Water,
            AppleHealthKit.Constants.Permissions.BodyMass,
          ],
        },
      };

      AppleHealthKit.initHealthKit(perms, (error: any) => {
        if (error) {
          if (__DEV__) console.log('[HealthKit] Init error:', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  };

  const saveCalories = (calories: number, date?: Date): Promise<void> => {
    if (!isAvailable || !healthKitEnabled) return Promise.resolve();

    return new Promise((resolve, reject) => {
      AppleHealthKit.saveFood(
        {
          value: calories,
          date: (date || new Date()).toISOString(),
          foodName: 'Kaly meal',
        },
        (error: any) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  };

  const saveWater = (milliliters: number, date?: Date): Promise<void> => {
    if (!isAvailable || !healthKitEnabled) return Promise.resolve();

    return new Promise((resolve, reject) => {
      AppleHealthKit.saveWater(
        {
          value: milliliters / 1000, // liters
          date: (date || new Date()).toISOString(),
        },
        (error: any) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  };

  const saveWeight = (kg: number, date?: Date): Promise<void> => {
    if (!isAvailable || !healthKitEnabled) return Promise.resolve();

    return new Promise((resolve, reject) => {
      AppleHealthKit.saveWeight(
        {
          value: kg * 2.20462, // HealthKit uses pounds internally
          date: (date || new Date()).toISOString(),
        },
        (error: any) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  };

  const getTodaySteps = (): Promise<number> => {
    if (!isAvailable || !healthKitEnabled) return Promise.resolve(0);

    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(
        { date: new Date().toISOString(), includeManuallyAdded: true },
        (error: any, results: any) => {
          if (error) resolve(0);
          else resolve(Math.round(results?.value || 0));
        }
      );
    });
  };

  const getTodayActiveCalories = (): Promise<number> => {
    if (!isAvailable || !healthKitEnabled) return Promise.resolve(0);

    return new Promise((resolve) => {
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      AppleHealthKit.getActiveEnergyBurned(
        {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        (error: any, results: any[]) => {
          if (error) {
            resolve(0);
          } else {
            const total = (results || []).reduce(
              (sum: number, r: any) => sum + (r.value || 0),
              0
            );
            resolve(Math.round(total));
          }
        }
      );
    });
  };

  return {
    isAvailable,
    healthKitEnabled,
    init,
    saveCalories,
    saveWater,
    saveWeight,
    getTodaySteps,
    getTodayActiveCalories,
  };
}
