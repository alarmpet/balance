import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { InsightGraphNode } from '../../types/database.types';

type InsightNodeDetailSheetProps = {
  node: InsightGraphNode | null;
  onClose: () => void;
};

export function InsightNodeDetailSheet({ node, onClose }: InsightNodeDetailSheetProps) {
  return (
    <Modal visible={Boolean(node)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.iconBubble}>
              <MaterialCommunityIcons name={iconForNode(node?.kind)} size={26} color="#0ea5e9" />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>{labelForKind(node?.kind)}</Text>
              <Text style={styles.title}>{node?.label ?? ''}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#64748b" />
            </Pressable>
          </View>
          <Text style={styles.body}>{bodyForNode(node)}</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>지도 점수</Text>
            <Text style={styles.scoreValue}>{Math.round((node?.score ?? 0) * 10) / 10}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function iconForNode(kind: InsightGraphNode['kind'] | undefined): keyof typeof MaterialCommunityIcons.glyphMap {
  if (kind === 'trait') return 'star';
  if (kind === 'category') return 'shape';
  if (kind === 'question') return 'comment-question';
  if (kind === 'theme') return 'palette-swatch';
  return 'paw';
}

function labelForKind(kind: InsightGraphNode['kind'] | undefined) {
  if (kind === 'trait') return '성향 가지';
  if (kind === 'category') return '카테고리';
  if (kind === 'question') return '근거 질문';
  if (kind === 'theme') return '섬 테마';
  return '중심 노드';
}

function bodyForNode(node: InsightGraphNode | null) {
  if (!node) return '';
  if (node.kind === 'trait') return '누적된 선택 가중치가 이 성향 가지를 키우고 있어요. 질문을 더 풀수록 굵기와 연결이 바뀝니다.';
  if (node.kind === 'category') return '최근 30일 동안 자주 만난 질문 카테고리예요. 카테고리별 선택 흐름이 성향 가지와 연결됩니다.';
  if (node.kind === 'question') return '현재 선택 지도를 설명하는 대표 질문입니다. 전체 기록은 공개되지 않고 요약 근거만 사용됩니다.';
  return '내 선택 지도의 중심입니다. 펫과 섬은 질문 선택으로 조금씩 자라납니다.';
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
    flex: 1,
    justifyContent: 'flex-end'
  },
  body: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 18
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    height: 5,
    marginBottom: 18,
    width: 48
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  headerCopy: {
    flex: 1
  },
  iconBubble: {
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52
  },
  kicker: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '900'
  },
  scoreLabel: {
    color: '#64748b',
    fontWeight: '800'
  },
  scoreRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14
  },
  scoreValue: {
    color: '#0ea5e9',
    fontSize: 18,
    fontWeight: '900'
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22
  },
  title: {
    color: '#164e63',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4
  }
});
