import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { styles } from "./styles";

export default function SettingsView({ theme, setTheme, onOpenFriendManagement, onOpenAccount }) {
  return (
    <View style={styles.settingsBox}>
      <Text style={styles.sectionTitle}>친구 관리</Text>
      <Text style={styles.settingDescription}>친구 추가/삭제/수정은 여기서 이루어집니다.</Text>
      <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenFriendManagement}>
        <Text style={styles.secondaryBtnText}>친구 관리 열기</Text>
      </TouchableOpacity>
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>어플리케이션 테마</Text>
      <Text style={styles.settingDescription}>
        기본 전화 테마가 기본값이며, 변경하면 캐시가 유지되는 동안 해당 테마로 머물게 됩니다.
      </Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>{theme === "kakao" ? "카카오 테마" : "기본 전화 테마"}</Text>
        <Switch value={theme === "kakao"} onValueChange={(value) => setTheme(value ? "kakao" : "ios")} />
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>계정 설정</Text>
      <Text style={styles.settingDescription}>연동된 이메일: test@example.com (테스트 계정)</Text>
      <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenAccount}>
        <Text style={styles.secondaryBtnText}>계정 설정</Text>
      </TouchableOpacity>
    </View>
  );
}
