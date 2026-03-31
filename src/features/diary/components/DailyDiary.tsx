import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { useDiary } from '../hooks/useDiary';
import { useDiaryStore } from '../store/diaryStore';
import { DateNavigator } from './DateNavigator';
import { DailyTotalsBar } from './DailyTotalsBar';
import { MealSection } from './MealSection';
import { WaterTracker } from './WaterTracker';
import { RecentMeals } from './RecentMeals';
import { ListSkeleton } from '../../../components/LoadingSkeleton';
import { FONT_SIZE } from '../../../lib/constants';
import type { MealType } from '../../../lib/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface DailyDiaryProps {
  date?: string;
}

export function DailyDiary({ date: dateProp }: DailyDiaryProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const { selectedDate, setSelectedDate } = useDiaryStore();
  const currentDate = dateProp || selectedDate;
  const { data: entries, isLoading } = useDiary(currentDate);

  const entriesByMeal = MEALS.reduce((acc, meal) => {
    acc[meal] = (entries || []).filter((e) => e.meal_type === meal);
    return acc;
  }, {} as Record<MealType, typeof entries>);

  const totalCalories = (entries || []).reduce((s, e) => s + e.total_calories, 0);
  const totalProtein = (entries || []).reduce((s, e) => s + e.total_protein, 0);
  const totalCarbs = (entries || []).reduce((s, e) => s + e.total_carbs, 0);
  const totalFat = (entries || []).reduce((s, e) => s + e.total_fat, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <DateNavigator date={currentDate} onDateChange={setSelectedDate} />

      <DailyTotalsBar
        calories={totalCalories}
        protein={totalProtein}
        carbs={totalCarbs}
        fat={totalFat}
      />

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {MEALS.map((meal) => (
            <MealSection
              key={meal}
              mealType={meal}
              entries={entriesByMeal[meal] || []}
              date={currentDate}
            />
          ))}
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <WaterTracker date={currentDate} />
      </View>

      {entries && entries.length === 0 && (
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <RecentMeals date={currentDate} />
        </View>
      )}
    </ScrollView>
  );
}
