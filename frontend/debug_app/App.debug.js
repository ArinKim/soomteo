// Debug App copy of trouble-shooting App.js
// This file is a safe, non-destructive copy of the backend/trouble-shooting App used
// to exercise the Kakao sign-in flow without changing the main frontend files.

import React, { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import LoginScreen from './components/LoginScreen'; // use the local debug component

// NOTE: Customize these values for your environment
// - On Android emulator, use 10.0.2.2 to reach localhost on the dev machine
// - On iOS simulator, use http://localhost
const API_BASE_URL = "http://10.0.2.2:8080";  // Android emulator base for debug
const KAKAO_CLIENT_ID = "YOUR_KAKAO_RESTAPI_KEY"; // replace with your Kakao REST API key

WebBrowser.maybeCompleteAuthSession();

export default function DebugApp() {
  const [screen, setScreen] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleKakaoLogin() {
    if (isLoggingIn) return;
    try {
      setIsLoggingIn(true);
      // Use a redirect URI registered in the Kakao developer console.
      // For the debug flow, point this at a reachable dev server or emulator address.
      const redirectUri = 'http://10.0.2.2:8080/callback';
      const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      let code = null;
      if (result.type === 'success' && result.url) {
        const match = result.url.match(/[?&]code=([^&]+)/);
        if (match && match[1]) code = decodeURIComponent(match[1]);
      }

      if (code) {
        const resp = await fetch(`${API_BASE_URL}/api/v1/auth/kakao/mobile/code`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri }),
        });
        if (!resp.ok) {
          Alert.alert('로그인 실패', await resp.text());
        } else {
          const userData = await resp.json();
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
          Alert.alert('로그인 성공', userData.nickname || '카카오 사용자');
        }
      } else {
        Alert.alert('로그인 취소/실패');
      }
    } catch (e) {
      Alert.alert('카카오 로그인 에러', String(e));
    } finally { setIsLoggingIn(false); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center' }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ padding: 20 }}>
        <Text style={{ fontWeight: '700', fontSize: 20, marginBottom: 10 }}>Debug: Kakao Login Test</Text>
        <TouchableOpacity onPress={handleKakaoLogin} style={{ backgroundColor: '#FEE500', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#3C1E1E', fontWeight: '700' }}>Run Kakao Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
