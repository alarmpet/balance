import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router, type Href } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

const LOGIN_ROUTE = '/login' as Href;

export default function AuthCallbackScreen() {
  const { error, handleAuthCallback } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    async function completeLogin() {
      const currentUrl = typeof window !== 'undefined'
        ? window.location.href
        : (await Linking.getInitialURL()) ?? Linking.createURL('auth/callback');

      const completed = await handleAuthCallback(currentUrl);
      if (isMounted && completed) {
        router.replace('/(tabs)/profile');
      }
    }

    void completeLogin();
    return () => {
      isMounted = false;
    };
  }, [handleAuthCallback]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#0ea5e9" />
      <Text style={styles.title}>로그인 완료 처리 중</Text>
      {error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => router.replace(LOGIN_ROUTE)}>
            <Text style={styles.retryText}>로그인으로 돌아가기</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#e0f7ff',
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  error: {
    color: '#be123c',
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '900'
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 16
  }
});
