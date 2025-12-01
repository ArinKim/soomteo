import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>반가워요! 👋</Text>
          <Text style={styles.subtitle}>로그인하고 AI 친구들을 만나보세요</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일 또는 전화번호</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor="#999"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoggingIn}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoggingIn}
            />
          </View>

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
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#3C1E1E" size="small" />
                <Text style={styles.loadingText}>로그인 중...</Text>
              </View>
            ) : (
              <View style={styles.kakaoButtonContent}>
                <Text style={styles.kakaoIcon}>💬</Text>
                <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.testInfo}>
            <Text style={styles.testInfoTitle}>💡 테스트 계정</Text>
            <View style={styles.testInfoRow}>
              <Text style={styles.testInfoLabel}>아이디:</Text>
              <Text style={styles.testInfoValue}>0000</Text>
            </View>
            <View style={styles.testInfoRow}>
              <Text style={styles.testInfoLabel}>비밀번호:</Text>
              <Text style={styles.testInfoValue}>0000</Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#1a1a1a",
  },
  loginButton: {
    backgroundColor: "#4c5ff2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#4c5ff2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: "#e0e0e0",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  kakaoButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  kakaoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  kakaoButtonText: {
    color: "#3C1E1E",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 8,
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
    borderWidth: 1,
    borderColor: "#d4e3ff",
  },
  testInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4c5ff2",
    marginBottom: 8,
  },
  testInfoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  testInfoLabel: {
    fontSize: 13,
    color: "#666",
    width: 70,
  },
  testInfoValue: {
    fontSize: 13,
    color: "#1a1a1a",
    fontWeight: "500",
  },
});