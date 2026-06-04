import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { GamificationSnapshot } from '../../services/gamificationService';
import { traitLabel } from '../../utils/traitLabels';

type Props = {
  snapshot: GamificationSnapshot;
};

// 펫 일기: 펫이 오늘의 선택을 바탕으로 짧은 일기를 남겨, 인사이트를 감성 채널로 전달한다.
// MVP는 클라이언트에서 그날의 상위 성향 + 참여로 생성(하루 단위 결정적). 이후 서버 자동 생성으로 심화.
const CLOSINGS = [
  '우리 섬에 오늘의 결이 한 줄 더 새겨졌어. 🌸',
  '내일은 또 어떤 너를 보게 될까? 기대돼. 🐾',
  '천천히, 그렇지만 분명하게 너를 알아가는 중이야. ☁️',
  '오늘의 선택도 너만의 색이었어. 🎨'
];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function PetDiaryCard({ snapshot }: Props) {
  const today = new Date();
  const todayCount = snapshot.profile.today_participation_count;
  const petName = snapshot.petState?.nickname?.trim() || snapshot.petSpecies?.display_name || '내 펫';
  const top = [...snapshot.traits].sort((a, b) => b.score - a.score)[0];

  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;
  const closing = CLOSINGS[(today.getDate() + (top ? top.trait_key.length : 0)) % CLOSINGS.length];

  let body: string;
  if (todayCount <= 0) {
    body = `오늘은 아직 주인을 못 만났어. 밸런스 한 판이면 오늘의 일기가 채워질 텐데! 기다리고 있을게.`;
  } else if (top) {
    body = `오늘 주인은 ${todayCount}번 선택했어. '${traitLabel(top.trait_key)}' 쪽으로 마음이 기우는 게 보였어. ${closing}`;
  } else {
    body = `오늘 주인이 ${todayCount}번 선택했어. 조금씩 너의 결이 보이기 시작했어. ${closing}`;
  }

  return (
    <View style={styles.card} key={dayKey(today)}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="notebook-outline" size={18} color="#b45309" />
        <Text style={styles.title}>{petName}의 오늘 일기</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: '#78350f', fontSize: 13, fontWeight: '700', lineHeight: 21, marginTop: 10 },
  card: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 18
  },
  date: { color: '#a16207', fontSize: 12, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { color: '#92400e', flex: 1, fontSize: 15, fontWeight: '900' }
});
