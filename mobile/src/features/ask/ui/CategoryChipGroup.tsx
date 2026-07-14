import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';

interface CategoryChipGroupProps {
  value: string;
  options: readonly string[];
  onChange(value: string): void;
  disabled?: boolean;
}

export function CategoryChipGroup({
  value,
  options,
  onChange,
  disabled = false,
}: CategoryChipGroupProps) {
  return (
    <View
      accessibilityLabel="카테고리 선택"
      accessibilityRole="radiogroup"
      style={styles.group}
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            accessibilityLabel={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled }}
            disabled={disabled}
            key={option}
            onPress={() => onChange(option)}
            style={[styles.chip, selected && styles.selected, disabled && styles.disabled]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.45 },
  label: { color: colors.text, fontWeight: '700' },
  selectedLabel: { color: colors.surface },
});

