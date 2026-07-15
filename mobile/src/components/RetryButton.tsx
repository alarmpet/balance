import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';

export function RetryButton({
  accessibilityLabel,
  disabled = false,
  onPress,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>다시 시도</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.primary,
    borderRadius: radius.button,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.75 },
  text: { color: colors.primary, fontWeight: '700' },
});
