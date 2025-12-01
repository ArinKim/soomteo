import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function LoginScreen({
  theme,  
  identifier,
  password,
  setIdentifier,
  setPassword,
  onLogin,
  onBack,
  onKakaoLogin,
  isLoggingIn = false,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>로그인</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="이메일 또는 사용자명"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          editable={!isLoggingIn}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoggingIn}
        />

        <TouchableOpacity
          style={[styles.loginButton, isLoggingIn && styles.disabledButton]}
          onPress={onLogin}
          disabled={isLoggingIn}
        >
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.kakaoButton, isLoggingIn && styles.disabledButton]}
          onPress={onKakaoLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <ActivityIndicator color="#3C1E1E" />
          ) : (
            <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
          )}
        </TouchableOpacity>

        <View style={styles.testInfo}>
          <Text style={styles.testInfoTitle}>테스트 계정</Text>
          <Text style={styles.testInfoText}>아이디: 0000</Text>
          <Text style={styles.testInfoText}>비밀번호: 0000</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  loginButton: {
    backgroundColor: "#4c5ff2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#999",
    fontSize: 14,
  },
  kakaoButton: {
    backgroundColor: "#FEE500",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  kakaoButtonText: {
    color: "#3C1E1E",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  testInfo: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#f0f4ff",
    borderRadius: 12,
  },
  testInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4c5ff2",
    marginBottom: 8,
  },
  testInfoText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
});
