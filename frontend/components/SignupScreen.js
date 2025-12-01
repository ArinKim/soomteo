import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function SignupScreen({ userProfile, onComplete, onSkip, initial = {} }) {
  const [email, setEmail] = useState(initial.email || "");
  const [name, setName] = useState(initial.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState(initial.gender || "");
  const [guardianPhone, setGuardianPhone] = useState(initial.guardianPhone || "");

  const genderOptions = ["MALE", "FEMALE"];

  function handleComplete() {
    if (!email || !name || !age || !gender || !guardianPhone || !password || !confirmPassword) {
      return alert('모든 항목(이메일, 이름, 나이, 성별, 보호자 전화번호)은 필수입니다.');
    }

    if (password !== confirmPassword) {
      return alert('비밀번호가 일치하지 않습니다.');
    }

    const payload = {
      email: email.trim(),
      name: name.trim(),
      age: age ? parseInt(age) : null,
      gender: gender,
      guardianPhone: guardianPhone,
      password,
    };

    // If this flow was initiated from a Kakao usersDetail record, include the userDetailId
    if (initial.userDetailId) {
      payload.userDetailId = initial.userDetailId;
    }

    if (initial.kakaoId) {
      payload.kakaoId = initial.kakaoId;
    }

    onComplete(payload);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>환영합니다! 🎉</Text>
        <Text style={styles.subtitle}>
          {userProfile.name}님을 위한 맞춤 AI 친구를 만들어드릴게요
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>이메일 (필수)</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>이름 (필수)</Text>
          <TextInput style={styles.input} placeholder="이름을 입력하세요" value={name} onChangeText={setName} />
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
          <TextInput
            style={styles.input}
            placeholder="나이를 입력하세요"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />
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

        {/* statusMessage removed per product request */}

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 이 정보는 언제든 설정에서 변경할 수 있습니다
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <Text style={styles.primaryButtonText}>시작하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => onSkip && onSkip()}>
          <Text style={styles.secondaryButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  form: {
    marginBottom: 30,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1a1a1a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 13,
    color: "#999",
    marginTop: 6,
  },
  toneButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  toneButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  toneButtonActive: {
    backgroundColor: "#4c5ff2",
    borderColor: "#4c5ff2",
  },
  toneButtonText: {
    fontSize: 14,
    color: "#666",
  },
  toneButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: '#4c5ff2',
    borderColor: '#4c5ff2',
  },
  genderText: { color: '#666' },
  genderTextActive: { color: '#fff', fontWeight: '600' },
  info: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#4c5ff2",
    textAlign: "center",
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#4c5ff2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 16,
  },
});