import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const categories = ['푸드', '라이프', '연애', '커리어', '문화'];

export default function CreateScreen() {
  const [title, setTitle] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [category, setCategory] = useState(categories[0]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Create</Text>
      <Text style={styles.heading}>새 밸런스 질문</Text>
      <Text style={styles.description}>
        AI 다듬기와 중복 검사는 앱 실행 안정화 후 Edge Function으로 다시 연결합니다.
      </Text>

      <Field label="질문 제목" value={title} onChangeText={setTitle} placeholder="예: 무인도 첫 식사는?" />
      <Field label="선택지 A" value={optionA} onChangeText={setOptionA} placeholder="예: 바삭한 치킨" />
      <Field label="선택지 B" value={optionB} onChangeText={setOptionB} placeholder="예: 시원한 빙수" />

      <Text style={styles.label}>카테고리</Text>
      <View style={styles.categoryRow}>
        {categories.map((item) => (
          <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipActive]}>
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => Alert.alert('준비 중', 'AI 다듬기와 중복 검사는 실제 Edge Function 연결 후 다시 열 예정입니다.')}
      >
        <Text style={styles.primaryButtonText}>AI로 다듬기</Text>
      </Pressable>
    </ScrollView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
};

function Field({ label, value, placeholder, onChangeText }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8aa3a1"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  chip: {
    backgroundColor: '#ffedd5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  chipActive: {
    backgroundColor: '#fb923c'
  },
  chipText: {
    color: '#9a3412',
    fontWeight: '800'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  container: {
    backgroundColor: '#fff7ed',
    flex: 1
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 56
  },
  description: {
    color: '#7c5f45',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  field: {
    marginTop: 18
  },
  heading: {
    color: '#3b2412',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#fed7aa',
    borderRadius: 16,
    borderWidth: 1,
    color: '#3b2412',
    fontSize: 16,
    marginTop: 8,
    minHeight: 52,
    paddingHorizontal: 14
  },
  kicker: {
    color: '#ea580c',
    fontSize: 13,
    fontWeight: '900'
  },
  label: {
    color: '#3b2412',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 18
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 54
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  }
});
