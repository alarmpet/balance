import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchThemeProbabilityDisclosure } from '../../services/gamificationService';

type ThemeProbabilitySheetProps = {
  visible: boolean;
  onClose: () => void;
  poolSlug?: string;
};

type DisclosedRarity = {
  rarity: 'common' | 'rare' | 'legendary';
  weight: number;
  probability: number;
};

type DisclosedItem = {
  theme_skin_id: string;
  slug: string;
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  weight: number;
  probability: number;
};

type DisclosedData = {
  pool?: {
    slug: string;
    name: string;
    guarantee_rule: string | null;
  };
  version: number;
  effective_at: string | null;
  rarities: DisclosedRarity[];
  items: DisclosedItem[];
};

const RARITY_MAP = {
  common: { label: '일반', color: '#0ea5e9' },
  rare: { label: '희귀', color: '#7c3aed' },
  legendary: { label: '전설', color: '#d97706' }
};

export default function ThemeProbabilitySheet({ visible, onClose, poolSlug = 'standard-theme' }: ThemeProbabilitySheetProps) {
  const [data, setData] = useState<DisclosedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setError(null);
      fetchThemeProbabilityDisclosure(poolSlug)
        .then((res) => {
          setData(res as DisclosedData);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError('확률 정보를 불러오지 못했습니다.');
          setIsLoading(false);
        });
    }
  }, [visible, poolSlug]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#0f766e" size="large" />
          <Text style={styles.loadingText}>공시 정보를 가져오는 중...</Text>
        </View>
      );
    }

    if (error || !data) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#be123c" />
          <Text style={styles.errorText}>{error || '불러올 정보가 없습니다.'}</Text>
        </View>
      );
    }

    const { pool, rarities, items } = data;

    return (
      <FlatList
        contentContainerStyle={styles.scrollContent}
        data={items}
        keyExtractor={(item) => item.theme_skin_id}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>테마 등급별 확률</Text>
            <View style={styles.rarityList}>
              {rarities.map((r) => {
                const info = RARITY_MAP[r.rarity] || { label: r.rarity, color: '#64748b' };
                return (
                  <View key={r.rarity} style={styles.rarityRow}>
                    <Text style={[styles.rarityLabel, { color: info.color }]}>{info.label}</Text>
                    <Text style={styles.rarityValue}>{r.probability}%</Text>
                  </View>
                );
              })}
            </View>

            {pool?.guarantee_rule ? (
              <View style={styles.ruleBox}>
                <MaterialCommunityIcons name="gift-outline" size={18} color="#0f766e" />
                <Text style={styles.ruleText}>{pool.guarantee_rule}</Text>
              </View>
            ) : null}

            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 8 }]}>개별 테마 확률</Text>
          </View>
        }
        renderItem={({ item }) => {
          const info = RARITY_MAP[item.rarity] || { label: item.rarity, color: '#64748b' };
          return (
            <View style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <View style={[styles.itemBadge, { borderColor: info.color }]}>
                  <Text style={[styles.itemBadgeText, { color: info.color }]}>{info.label}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.itemProb}>{item.probability}%</Text>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              공시 버전: v{data.version}
              {data.effective_at ? ` (적용일: ${new Date(data.effective_at).toLocaleDateString('ko-KR')})` : ''}
            </Text>
            <Text style={styles.footerText}>
              * 획득 확률은 소수점 아래 4자리까지 표기되었으며 반올림 오차가 있을 수 있습니다.
            </Text>
            <Text style={styles.footerText}>
              * 중복된 테마 획득 시 해당 테마가 자동으로 강화되며 레벨이 증가합니다.
            </Text>
          </View>
        }
      />
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#0f766e" />
              <Text style={styles.title}>테마 뽑기 확률 공시</Text>
            </View>
            <Pressable style={styles.closeIcon} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          {renderContent()}

          <Pressable style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'flex-end'
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  closeIcon: {
    padding: 4
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 16,
    justifyContent: 'center',
    margin: 20,
    minHeight: 52
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900'
  },
  errorText: {
    color: '#be123c',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10
  },
  footer: {
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    gap: 4,
    marginTop: 20,
    paddingTop: 16
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  itemBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  itemBadgeText: {
    fontSize: 10,
    fontWeight: '900'
  },
  itemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  itemName: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800'
  },
  itemProb: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  },
  itemRow: {
    alignItems: 'center',
    borderBottomColor: '#f8fafc',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  loadingText: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12
  },
  rarityLabel: {
    fontSize: 14,
    fontWeight: '900'
  },
  rarityList: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    gap: 12,
    marginTop: 12,
    padding: 16
  },
  rarityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  rarityValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900'
  },
  ruleBox: {
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 12
  },
  ruleText: {
    color: '#0f766e',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18
  },
  scrollContent: {
    padding: 20
  },
  sectionHeader: {
    marginBottom: 8
  },
  sectionTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '900'
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%'
  },
  title: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900'
  }
});
