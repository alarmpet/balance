import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

type TabIconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0f766e',
        tabBarInactiveTintColor: '#8aa3a1',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700'
        },
        tabBarStyle: {
          backgroundColor: '#f8fffb',
          borderTopColor: '#d9f3ed',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8
        }
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
