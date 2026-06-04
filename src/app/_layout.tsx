import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { LogBox, Platform } from 'react-native';

LogBox.ignoreLogs([
  'Unknown event property',
  '"shadow*" style props are deprecated',
  'props.pointerEvents is deprecated'
]);

if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('balance-island-global-web-style')) {
  const style = document.createElement('style');
  style.id = 'balance-island-global-web-style';
  style.textContent = `
    body, div, span, p, a, img {
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    }
    input, textarea, [contenteditable="true"] {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
  `;
  document.head.appendChild(style);
}
export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="insight-map" />
      </Stack>
    </>
  );
}
