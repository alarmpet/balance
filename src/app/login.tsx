import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import type { SocialProvider } from '../services/authService';

const providers: Array<{ provider: SocialProvider; label: string; tone: string; enabled: boolean }> = [
  { provider: 'kakao', label: '카카오로 시작', tone: '#fee500', enabled: true },
  { provider: 'google', label: '구글로 시작', tone: '#ffffff', enabled: true },
  { provider: 'custom:naver', label: '네이버로 시작', tone: '#03c75a', enabled: false }
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { isMutating, error, magicLinkSentTo, signInSocial, sendMagicLinkEmail } = useAuthStore();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSocial(provider: SocialProvider, enabled: boolean) {
    if (!enabled) return;
    await signInSocial(provider);
    const { user } = useAuthStore.getState();
    if (user) {
      router.replace('/(tabs)/profile');
    }
  }

  async function handleMagicLink() {
    if (cooldown > 0) return;
    await sendMagicLinkEmail(email);
    setCooldown(60);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>밸런스 아일랜드</Text>
      <Text style={styles.title}>내 성향 섬을 저장하려면 로그인해주세요</Text>
      <Text style={styles.body}>질문 기록, 조개, 성향 펫, 테마 보상이 내 계정에 안전하게 연결됩니다.</Text>

      <View style={styles.providerList}>
        {providers.map((item) => (
          <Pressable
            key={item.provider}
            disabled={isMutating || !item.enabled}
            style={[styles.providerButton, { backgroundColor: item.tone }, !item.enabled ? styles.disabled : null]}
            onPress={() => handleSocial(item.provider, item.enabled)}
          >
            <Text style={[styles.providerText, item.provider === 'kakao' ? styles.darkText : null]}>
              {item.enabled ? item.label : `${item.label} - 준비 중`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>이메일 매직 링크</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="email@example.com"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <Pressable disabled={isMutating || cooldown > 0} style={[styles.magicButton, isMutating || cooldown > 0 ? styles.disabled : null]} onPress={handleMagicLink}>
        {isMutating ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.magicText}>{cooldown > 0 ? `${cooldown}초 후 다시 보내기` : '로그인 링크 받기'}</Text>
        )}
      </Pressable>

      {magicLinkSentTo ? (
        <Text style={styles.success}>{magicLinkSentTo} 주소로 로그인 링크를 보냈어요. 메일함과 스팸함을 확인해주세요.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>나중에 하기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 12
  },
  backText: {
    color: '#0f766e',
    fontWeight: '900'
  },
  body: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 10
  },
  container: {
    backgroundColor: '#e0f7ff',
    flex: 1
  },
  content: {
    padding: 24,
    paddingBottom: 40,
    paddingTop: 72
  },
  darkText: {
    color: '#3b2f00'
  },
  disabled: {
    opacity: 0.45
  },
  divider: {
    backgroundColor: '#bae6fd',
    height: 1,
    marginVertical: 24
  },
  error: {
    color: '#be123c',
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center'
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#7dd3fc',
    borderRadius: 16,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    minHeight: 52,
    paddingHorizontal: 16
  },
  kicker: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '900'
  },
  magicButton: {
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52
  },
  magicText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  },
  providerButton: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54
  },
  providerList: {
    gap: 12,
    marginTop: 24
  },
  providerText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900'
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12
  },
  success: {
    color: '#047857',
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center'
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: 8
  }
});
