import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import type { ChoiceEchoResult } from '../../utils/choiceEcho';
import { analyticsService } from '../../services/analyticsService';
import { THEME } from '../../theme/styles';

type ChoiceEchoSheetProps = {
  visible: boolean;
  onClose: () => void;
  echoData: ChoiceEchoResult | null;
};

const RARITY_COLORS: Record<string, string> = {
  pioneer: '#6366f1',
  unicorn: '#a855f7',
  minority: '#0ea5e9',
  even: '#f59e0b',
  majority: '#10b981'
};

export default function ChoiceEchoSheet({ visible, onClose, echoData }: ChoiceEchoSheetProps) {
  if (!echoData) return null;

  const rarityColor = RARITY_COLORS[echoData.rarityTier] ?? '#0f766e';

  const handleOpenMap = () => {
    analyticsService.track('choice_echo_map_open', {
      category: echoData.categoryName,
      option: echoData.optionTitle
    });
    onClose();
    router.push('/insight' as Href);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="선택의 메아리 닫기"
          style={styles.dismissArea}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: echoData.categoryColor + '22' }]}>
              <Text style={[styles.categoryText, { color: echoData.categoryColor }]}>
                {echoData.categoryName}
              </Text>
            </View>
            <Text style={styles.title}>선택의 메아리</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.choiceBox}>
              <Text style={styles.choiceLabel}>선택한 답변</Text>
              <Text style={styles.choiceTitle}>"{echoData.optionTitle}"</Text>
            </View>

            <View style={[styles.rarityBox, { borderColor: rarityColor + '55', backgroundColor: rarityColor + '14' }]}>
              {echoData.rarityPercent !== null && (
                <Text style={[styles.rarityPercent, { color: rarityColor }]}>{echoData.rarityPercent}%</Text>
              )}
              <View style={styles.rarityTextArea}>
                <Text style={[styles.rarityHeadline, { color: rarityColor }]}>{echoData.rarityHeadline}</Text>
                <Text style={styles.rarityFlavor}>{echoData.rarityFlavor}</Text>
              </View>
            </View>

            <View style={styles.petBubble}>
              <MaterialCommunityIcons name="paw" size={18} color="#b45309" style={styles.echoIcon} />
              <Text style={styles.petText}>{echoData.petLine}</Text>
            </View>

            <View style={styles.echoMessageBox}>
              <MaterialCommunityIcons name="comment-text-outline" size={20} color="#0f766e" style={styles.echoIcon} />
              <Text style={styles.echoText}>{echoData.text}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="닫기" style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="내 성향 지도 보기"
              style={styles.mapButton}
              onPress={handleOpenMap}
            >
              <MaterialCommunityIcons name="map-marker-distance" size={18} color="#ffffff" />
              <Text style={styles.mapButtonText}>내 지도 보기</Text>
            </Pressable>
          </View>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
    width: '100%'
  },
  categoryBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '900'
  },
  choiceBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    gap: 4,
    padding: 16
  },
  choiceLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700'
  },
  choiceTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900'
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52
  },
  closeButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '900'
  },
  content: {
    gap: 14,
    paddingHorizontal: 20,
    width: '100%'
  },
  dismissArea: {
    flex: 1
  },
  dragIndicator: {
    alignSelf: 'center',
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    height: 5,
    marginBottom: 20,
    width: 48
  },
  echoIcon: {
    marginTop: 2
  },
  echoMessageBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#99f6e4',
    borderRadius: THEME.shapes.borderRadiusCard,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 16
  },
  echoText: {
    color: '#0f766e',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 22
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 20
  },
  petBubble: {
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderRadius: THEME.shapes.borderRadiusCard,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  petText: {
    color: '#92400e',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19
  },
  rarityBox: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  rarityFlavor: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700'
  },
  rarityHeadline: {
    fontSize: 15,
    fontWeight: '900'
  },
  rarityPercent: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0
  },
  rarityTextArea: {
    flex: 1,
    gap: 3
  },
  mapButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 16,
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52
  },
  mapButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900'
  },
  sheet: {
    backgroundColor: THEME.surfaces.background.panel,
    borderColor: THEME.surfaces.border.light,
    borderTopLeftRadius: THEME.shapes.borderRadiusSheet,
    borderTopRightRadius: THEME.shapes.borderRadiusSheet,
    borderWidth: 1,
    paddingBottom: 34,
    paddingTop: 10,
    ...THEME.shadows.glass
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900'
  }
});
