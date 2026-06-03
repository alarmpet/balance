import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { analyticsService } from '../../services/analyticsService';

export type IslandMode = 'discover' | 'branch_map' | 'decorate';

type IslandModeTabsProps = {
  activeMode: IslandMode;
  onChangeMode: (mode: IslandMode) => void;
};

export default function IslandModeTabs({ activeMode, onChangeMode }: IslandModeTabsProps) {
  const handleModeChange = (mode: IslandMode) => {
    analyticsService.track('island_mode_change', { mode });
    onChangeMode(mode);
  };

  return (
    <View style={styles.tabsContainer}>
      <TabButton
        icon="lightbulb-on-outline"
        label="발견"
        active={activeMode === 'discover'}
        onPress={() => handleModeChange('discover')}
      />
      <TabButton
        icon="sitemap-outline"
        label="가지 지도"
        active={activeMode === 'branch_map'}
        onPress={() => handleModeChange('branch_map')}
      />
      <TabButton
        icon="island"
        label="꾸미기"
        active={activeMode === 'decorate'}
        onPress={() => handleModeChange('decorate')}
      />
    </View>
  );
}

type TabButtonProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
};

function TabButton({ icon, label, active, onPress }: TabButtonProps) {
  return (
    <Pressable
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={active ? '#ffffff' : '#075985'}
      />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10
  },
  tabButtonActive: {
    backgroundColor: '#0ea5e9'
  },
  tabText: {
    color: '#075985',
    fontSize: 13,
    fontWeight: '900'
  },
  tabTextActive: {
    color: '#ffffff'
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#bae6fd',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginTop: 18,
    padding: 6,
    width: '100%'
  }
});
