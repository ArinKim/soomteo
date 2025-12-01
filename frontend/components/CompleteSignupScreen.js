import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';

export default function CompleteSignupScreen({ initial, onComplete, onCancel }) {
  // initial: { nickname, email, userDetailId }
  const [email, setEmail] = useState(initial?.email || '');
  const [name, setName] = useState(initial?.nickname || '');
  const [age, setAge] = useState(initial?.age || '');
  const [gender, setGender] = useState(initial?.gender || '');
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardianPhone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function submit() {
    if (!email || !name || !age || !gender || !guardianPhone || !password || !confirmPassword) {
      return Alert.alert('필수 항목', '모든 항목(이메일, 이름, 나이, 성별, 보호자 전화번호, 비밀번호)을 입력하세요');
    }

    if (password !== confirmPassword) {
      return Alert.alert('비밀번호 오류', '비밀번호가 일치하지 않습니다');
    }

    onComplete({
      email,
      name,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      guardianPhone: guardianPhone || null,
      profileImageUrl: initial?.profileImage || null,
      kakaoId: initial?.kakaoId || null,
      password: password,
      userDetailId: initial?.userDetailId,
    });
  }

  const genderOptions = ['MALE', 'FEMALE'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>회원가입을 완료해주세요</Text>
      <Text style={styles.subtitle}>카카오 계정으로 일부 정보가 전달되었습니다. 아래 정보를 확인 / 입력해주세요.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>이메일 (필수)</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>이름 (필수)</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>비밀번호 (필수)</Text>
        <TextInput style={styles.input} placeholder="비밀번호 입력" secureTextEntry value={password} onChangeText={setPassword} autoCapitalize="none" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>비밀번호 확인 (필수)</Text>
        <TextInput style={styles.input} placeholder="비밀번호 확인" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} autoCapitalize="none" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>나이 (필수)</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>성별 (필수)</Text>
        <View style={styles.genderButtons}>
          {genderOptions.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderButton, gender === g && styles.genderButtonActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g === 'MALE' ? '남성' : '여성'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>보호자 전화번호 (필수)</Text>
        <TextInput style={styles.input} value={guardianPhone} onChangeText={setGuardianPhone} keyboardType="phone-pad" />
      </View>

      {/* statusMessage removed */}

      <TouchableOpacity style={styles.primaryButton} onPress={submit}>
        <Text style={styles.primaryButtonText}>회원가입 완료</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
        <Text style={styles.secondaryButtonText}>뒤로가기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, backgroundColor: '#fafafa' },
  primaryButton: { backgroundColor: '#4c5ff2', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { padding: 12, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#666' },
  genderButtons: { flexDirection: 'row', gap: 8 },
  genderButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  genderButtonActive: { backgroundColor: '#4c5ff2', borderColor: '#4c5ff2' },
  genderText: { color: '#666' },
  genderTextActive: { color: '#fff', fontWeight: '600' },
});
