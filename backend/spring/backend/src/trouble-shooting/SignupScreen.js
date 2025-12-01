import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function SignupScreen({ userProfile, onComplete, onSkip }) {
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");
  const [preferredTone, setPreferredTone] = useState("친근한");

  const toneOptions = ["친근한", "공감적인", "전문적인", "활발한"];

  function handleComplete() {
    const additionalInfo = {
      age: age ? parseInt(age) : null,
      interests: interests.split(",").map((i) => i.trim()).filter(Boolean),
      preferredTone,
    };
    onComplete(additionalInfo);
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
          <Text style={styles.label}>나이 (선택)</Text>
          <TextInput
            style={styles.input}
            placeholder="나이를 입력하세요"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>관심사 (선택)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="예: 운동, 음악, 요리 (쉼표로 구분)"
            multiline
            numberOfLines={3}
            value={interests}
            onChangeText={setInterests}
          />
          <Text style={styles.hint}>
            관심사를 알려주시면 더 공감하는 대화를 나눌 수 있어요
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>선호하는 대화 톤</Text>
          <View style={styles.toneButtons}>
            {toneOptions.map((tone) => (
              <TouchableOpacity
                key={tone}
                style={[
                  styles.toneButton,
                  preferredTone === tone && styles.toneButtonActive,
                ]}
                onPress={() => setPreferredTone(tone)}
              >
                <Text
                  style={[
                    styles.toneButtonText,
                    preferredTone === tone && styles.toneButtonTextActive,
                  ]}
                >
                  {tone}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>나중에 설정하기</Text>
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