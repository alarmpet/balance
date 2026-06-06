import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  petName: string;
  /** 부재 길이 라벨(예: "8시간", "어제", "3일") */
  awayLabel: string;
  /** 오늘 펫 선물(=출석 보상)을 아직 안 받았는가 */
  giftAvailable: boolean;
  claiming: boolean;
  onClaim: () => void;
  onDismiss: () => void;
};

// 펫이 부재중에 "한 일" 풀. 변동 보상(다마고치식 "또 뭐 했나")의 핵심 — 매번 다른 한 줄.
// 조개를 물어온 라인은 보상과 자연스럽게 이어진다.
const ACTIVITIES_WITH_GIFT = [
  '수평선까지 헤엄쳐 조개를 한 움큼 주워왔어',
  '모래밭을 파다가 반짝이는 조개를 찾았대',
  '썰물 때 바위틈을 뒤져 조개를 모아뒀어',
  '지나가던 갈매기랑 흥정해서 조개를 받아왔대'
];
const ACTIVITIES_PLAIN = [
  '섬을 한 바퀴 돌며 너를 기다렸어',
  '야자수 그늘에서 낮잠 자다 네 꿈을 꿨대',
  '파도 소리를 들으며 네 생각을 했대',
  '새 친구를 만나서 네 자랑을 잔뜩 했대'
];

export function PetAwayCard({ petName, awayLabel, giftAvailable, claiming, onClaim, onDismiss }: Props) {
  // 마운트마다 랜덤 한 줄(변동성). 보상 가능하면 "조개 물어온" 라인, 아니면 일반 라인.
  const activity = useMemo(() => {
    const pool = giftAvailable ? ACTIVITIES_WITH_GIFT : ACTIVITIES_PLAIN;
    return pool[Math.floor(Math.random() * pool.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        style={styles.dismiss}
        hitSlop={10}
        onPress={onDismiss}
      >
        <MaterialCommunityIcons name="close" size={18} color="#92400e" />
      </Pressable>

      <View style={styles.header}>
        <MaterialCommunityIcons name="paw" size={18} color="#b45309" />
        <Text style={styles.title}>네가 없던 {awayLabel} 동안</Text>
      </View>

      <Text style={styles.body}>
        {petName}이(가) {activity}!
      </Text>

      {giftAvailable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="펫이 가져온 조개 받기"
          disabled={claiming}
          style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
          onPress={onClaim}
        >
          <Text style={styles.claimButtonText}>{claiming ? '받는 중…' : '🐚 조개 10개 받기'}</Text>
        </Pressable>
      ) : (
        <View style={styles.claimedRow}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#0f766e" />
          <Text style={styles.claimedText}>오늘 몫은 이미 챙겨뒀대 🐾</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 14,
    padding: 18,
    position: 'relative'
  },
  dismiss: { position: 'absolute', right: 12, top: 12, zIndex: 2 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingRight: 24 },
  title: { color: '#92400e', fontSize: 14, fontWeight: '900' },
  body: { color: '#78350f', fontSize: 15, fontWeight: '800', lineHeight: 23, marginTop: 10 },
  claimButton: {
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 46
  },
  claimButtonDisabled: { opacity: 0.6 },
  claimButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  claimedRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 14 },
  claimedText: { color: '#0f766e', fontSize: 13, fontWeight: '800' }
});
