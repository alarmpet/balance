import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { InsightContradiction } from '../../types/database.types';

type Props = {
  contradiction: InsightContradiction;
};

// 모순 발견을 '일관성 없음'이 아니라 '상황별 다른 나'로 긍정 프레이밍해서 보여준다.
export function ContradictionCard({ contradiction }: Props) {
  const { trait_label, high_category, high_percent, low_category, low_percent, message } = contradiction;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="compare" size={18} color="#7c3aed" />
        <Text style={styles.kicker}>상황별 다른 나</Text>
      </View>

      <View style={styles.compareRow}>
        <Bar category={high_category} percent={high_percent} trait={trait_label} emphasis />
        <Text style={styles.vs}>vs</Text>
        <Bar category={low_category} percent={low_percent} trait={trait_label} />
      </View>

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function Bar({
  category,
  percent,
  trait,
  emphasis = false
}: {
  category: string;
  percent: number;
  trait: string;
  emphasis?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View style={styles.barCol}>
      <Text style={styles.barCategory}>{category}</Text>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { height: `${clamped}%`, backgroundColor: emphasis ? '#8b5cf6' : '#c4b5fd' }
          ]}
        />
      </View>
      <Text style={[styles.barPercent, emphasis ? styles.barPercentStrong : null]}>{clamped}%</Text>
      <Text style={styles.barTrait}>{trait}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barCategory: { color: '#475569', fontSize: 12, fontWeight: '900' },
  barCol: { alignItems: 'center', flex: 1, gap: 6 },
  barFill: { borderRadius: 999, bottom: 0, position: 'absolute', width: '100%' },
  barPercent: { color: '#64748b', fontSize: 13, fontWeight: '800' },
  barPercentStrong: { color: '#7c3aed', fontSize: 15, fontWeight: '900' },
  barTrack: {
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 12,
    height: 88,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 44
  },
  barTrait: { color: '#94a3b8', fontSize: 10, fontWeight: '800' },
  card: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    padding: 16
  },
  compareRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 14
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  kicker: { color: '#7c3aed', fontSize: 12, fontWeight: '900' },
  message: { color: '#475569', fontSize: 13, fontWeight: '700', lineHeight: 20, marginTop: 16 },
  vs: { color: '#a78bfa', fontSize: 13, fontWeight: '900' }
});
