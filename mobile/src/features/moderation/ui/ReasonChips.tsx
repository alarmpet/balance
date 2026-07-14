import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';
import { REASONS, type ReasonCode } from '../domain/reasons';

interface ReasonChipsProps {
  disabled?: boolean;
  onReact(reason: ReasonCode): void;
}

export function ReasonChips({ disabled = false, onReact }: ReasonChipsProps) {
  const [selected, setSelected] = useState<ReasonCode | null>(null);

  return (
    <View accessibilityLabel="선택 이유" style={styles.list}>
      {REASONS.map((reason) => {
        const active = selected === reason.code;
        return (
          <Pressable
            accessibilityLabel={reason.label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            disabled={disabled || undefined}
            key={reason.code}
            onPress={() => {
              if (disabled) return;
              setSelected(reason.code);
              onReact(reason.code);
            }}
            style={[styles.chip, active && styles.activeChip]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>
              {active ? `✓ ${reason.label}` : reason.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  activeChip: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  label: { color: colors.text },
  activeLabel: { color: colors.primary, fontWeight: '700' },
});
