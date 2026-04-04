import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../../lib/theme';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { FONT_SIZE, RADIUS } from '../../../lib/constants';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';

const FEEDBACK_TYPES = ['wrong_food', 'wrong_portion', 'wrong_calories', 'missing_ingredient', 'other'] as const;

interface MealEditModalProps {
  visible: boolean;
  onClose: () => void;
  diaryEntryId?: string;
}

export function MealEditModal({ visible, onClose, diaryEntryId }: MealEditModalProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const [type, setType] = useState<string>('wrong_food');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleSubmit = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await supabase.from('ai_feedback').insert({
        user_id: user.id,
        diary_entry_id: diaryEntryId || null,
        feedback_type: type,
        description: description || null,
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={submitted ? undefined : t('feedback.title')}>
      {submitted ? (
        <View style={{ alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✓</Text>
          <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '600', color: colors.text }}>
            {t('feedback.thanks')}
          </Text>
        </View>
      ) : (
        <View>
          <View style={{ gap: 8, marginBottom: 16 }}>
            {FEEDBACK_TYPES.map((ft) => (
              <Pressable
                key={ft}
                onPress={() => setType(ft)}
                accessibilityRole="button"
                style={{
                  padding: 12,
                  minHeight: 44,
                  borderRadius: RADIUS.md,
                  backgroundColor: type === ft ? colors.primaryLight : colors.surface,
                  borderWidth: 1.5,
                  borderColor: type === ft ? colors.primary : 'transparent',
                }}
              >
                <Text style={{ fontWeight: '500', color: type === ft ? colors.primary : colors.text }}>
                  {t(`feedback.${ft}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('feedback.description')}
            placeholderTextColor={colors.textSecondary}
            accessibilityLabel={t('scan.feedback_input')}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderRadius: RADIUS.md,
              padding: 14,
              fontSize: FONT_SIZE.sm,
              color: colors.text,
              minHeight: 80,
              textAlignVertical: 'top',
              marginBottom: 16,
            }}
          />

          <Button title={t('feedback.submit')} onPress={handleSubmit} disabled={isSubmitting} />
        </View>
      )}
    </Modal>
  );
}
