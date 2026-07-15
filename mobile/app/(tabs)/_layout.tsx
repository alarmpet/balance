import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: '플레이' }} />
      <Tabs.Screen name="ask" options={{ title: '물어보기' }} />
      <Tabs.Screen name="brain" options={{ title: '나의 뇌' }} />
      <Tabs.Screen name="profile" options={{ title: '마이' }} />
    </Tabs>
  );
}
