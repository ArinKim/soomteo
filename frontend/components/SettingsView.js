import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function SettingsView({
  theme,
  setTheme,
  onOpenFriendManagement,
  onOpenAccount,
  onKakaoUnlink,
}) {
  
  const handleKakaoUnlink = async () => {
    Alert.alert(
      '카카오 연결 해제',
      '정말로 카카오 계정 연결을 해제하시겠습니까?\n\n연결을 해제하면 자동으로 로그아웃됩니다.',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '해제',
          style: 'destructive',
          onPress: async () => {
            try {
              const KakaoLogin = require('@react-native-seoul/kakao-login');
              await KakaoLogin.unlink();
              
              // 부모 컴포넌트의 언링크 핸들러 호출 (로그아웃 처리)
              if (onKakaoUnlink) {
                onKakaoUnlink();
              }
              
              Alert.alert('연결 해제 완료', '카카오 계정 연결이 해제되었습니다.');
            } catch (error) {
              console.error('Unlink error:', error);
              Alert.alert('연결 해제 실패', error.message || '오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>설정</Text>

      <TouchableOpacity style={styles.settingItem} onPress={onOpenFriendManagement}>
        <Text style={styles.settingText}>친구 관리</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={onOpenAccount}>
        <Text style={styles.settingText}>계정 설정</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {/* 카카오 연결 해제 버튼 추가 */}
      <TouchableOpacity style={styles.unlinkItem} onPress={handleKakaoUnlink}>
        <Text style={styles.unlinkText}>🔗 카카오 계정 연결 해제</Text>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.themeSelector}>
        <Text style={styles.themeLabel}>테마:</Text>
        <TouchableOpacity
          style={[styles.themeButton, theme === "ios" && styles.themeButtonActive]}
          onPress={() => setTheme("ios")}
        >
          <Text style={theme === "ios" ? styles.themeTextActive : styles.themeText}>
            iOS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.themeButton, theme === "android" && styles.themeButtonActive]}
          onPress={() => setTheme("android")}
        >
          <Text style={theme === "android" ? styles.themeTextActive : styles.themeText}>
            Android
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 10,
  },
  settingText: {
    fontSize: 16,
    color: "#333",
  },
  arrow: {
    fontSize: 20,
    color: "#999",
  },
  // 카카오 언링크 버튼 스타일
  unlinkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  unlinkText: {
    fontSize: 16,
    color: "#ff6b6b",
    fontWeight: "600",
  },
  themeSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  themeLabel: {
    fontSize: 16,
    marginRight: 15,
  },
  themeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    marginRight: 10,
  },
  themeButtonActive: {
    backgroundColor: "#4c5ff2",
  },
  themeText: {
    color: "#666",
  },
  themeTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});