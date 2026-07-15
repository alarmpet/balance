import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/src/design/tokens';

interface SettingRowProps {
  icon?: ReactNode;
  label: string;
  value?: string;
  control: ReactNode;
  disabled?: boolean;
}

export function SettingRow({ icon, label, value, control, disabled = false }: SettingRowProps) {
  return (
    <View accessibilityLabel={`${label}${value ? `, ${value}` : ''}`} style={[styles.row, disabled && styles.disabled]}>
      {icon ? <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{icon}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {value ? <Text style={styles.value}>{value}</Text> : null}
      </View>
      <View style={styles.control}>{control}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    padding: spacing.md,
  },
  disabled: { opacity: 0.45 },
  copy: { flex: 1, gap: spacing.xs },
  label: { color: colors.text, fontWeight: '700' },
  value: { color: colors.muted, fontSize: 13 },
  control: { flexShrink: 1 },
});
