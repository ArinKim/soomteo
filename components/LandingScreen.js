import React from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { styles } from "./styles";

export default function LandingScreen({ theme, onLoginPress }) {
  return (
    <SafeAreaView
      style={[
        styles.container,
        theme === "kakao" ? styles.kakaoBg : styles.iosBg,
      ]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.center}>
        <Image
          source={require("../assets/soomteo-logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={onLoginPress} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>로그인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
