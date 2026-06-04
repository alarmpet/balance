import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabIconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(8, insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#8aa3a1',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 2
        },
        tabBarStyle: {
          backgroundColor: 'rgba(248, 255, 251, 0.94)',
          borderColor: 'rgba(153, 246, 228, 0.7)',
          borderRadius: 22,
          borderTopColor: 'rgba(153, 246, 228, 0.7)',
          borderWidth: 1,
          height: 60 + bottomInset,
          marginBottom: Math.max(8, bottomInset / 2),
          marginHorizontal: 14,
          paddingBottom: bottomInset,
          paddingTop: 8,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 18
        },
        tabBarItemStyle: {
          borderRadius: 16
        },
        tabBarHideOnKeyboard: true
      }}
    >
      <Tabs.Screen name="index" options={{ title: '피드', tabBarIcon: tabIcon('albums') }} />
      <Tabs.Screen name="create" options={{ title: '작성', tabBarIcon: tabIcon('create') }} />
      <Tabs.Screen name="island" options={{ title: '섬', tabBarIcon: tabIcon('leaf') }} />
      <Tabs.Screen name="insight" options={{ title: '인사이트', tabBarIcon: tabIcon('sparkles') }} />
      <Tabs.Screen name="profile" options={{ title: '마이', tabBarIcon: tabIcon('person-circle') }} />
    </Tabs>
  );
}
