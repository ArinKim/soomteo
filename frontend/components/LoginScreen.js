import React from "react";
import { SafeAreaView, StatusBar, View, Text, TextInput, TouchableOpacity } from "react-native";
import { styles } from "./styles";

export default function LoginScreen({ theme, identifier, password, setIdentifier, setPassword, onLogin, onBack }) {
  return (
    <SafeAreaView style={[styles.container, theme === "kakao" ? styles.kakaoBg : styles.iosBg]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.loginBox, theme === "ios" && styles.loginBoxIos]}>
        <Text style={styles.loginTitle}>로그인</Text>
        <TextInput
          placeholder="이메일 또는 전화번호"
          value={identifier}
          onChangeText={setIdentifier}
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
        <TouchableOpacity onPress={onLogin} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={styles.linkBtn}>
          <Text>뒤로</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
