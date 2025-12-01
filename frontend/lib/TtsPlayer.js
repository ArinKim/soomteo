import { Audio } from "expo-av";
import { Platform, NativeModules } from "react-native";

function resolveBaseUrl() {
  // 1) Explicit override via env
  const envUrl = process.env.EXPO_PUBLIC_TTS_URL;
  if (envUrl) return envUrl;

  // 2) Derive host from Metro bundle URL (works in dev for emulator and real device)
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL || "";
    // e.g., http://10.0.2.2:8002/index.bundle?platform=android
    // or http://192.168.0.12:8002/index.bundle?platform=android
    // or http://localhost:8002/index.bundle?platform=android (some setups)
    const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::\d+)?\//);
    if (match && match[1]) {
      const host = match[1];
      if (
        Platform.OS === "android" &&
        (host === "localhost" || host === "127.0.0.1")
      ) {
        return "http://10.0.2.2:3001";
      }
      return `http://${host}:3001`;
    }
  } catch {}

  // 3) Fallback by platform
  return Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001";
}

const BASE_URL = resolveBaseUrl();

export async function playTts(text, options = {}) {
  let sound;

  // 쿼리 파라미터 구성
  const params = new URLSearchParams({
    text: text,
    ...(options.voice && { voice: options.voice }),
    ...(options.rate && { rate: options.rate }),
    ...(options.pitch && { pitch: options.pitch }),
    ...(options.volume && { volume: options.volume }),
  });

  const url = `${BASE_URL}/tts?${params.toString()}`;
  try {
    if (__DEV__) console.log("[TTS] fetch", url);
    const res = await fetch(url);
    if (__DEV__)
      console.log("[TTS] status", res.status, res.headers.get("content-type"));
    if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);

    const json = await res.json();
    if (__DEV__) console.log("[TTS] response keys", Object.keys(json || {}));
    const { audioContent } = json || {};
    if (__DEV__)
      console.log(
        "[TTS] audio length",
        audioContent ? audioContent.length : 0,
        audioContent ? `${audioContent.slice(0, 32)}...` : "no audio"
      );
    if (!audioContent) throw new Error("No audioContent in TTS response");

    const uri = `data:audio/mp3;base64,${audioContent}`;

    sound = new Audio.Sound();
    if (__DEV__) console.log("[TTS] loading sound");
    await sound.loadAsync({ uri }, { shouldPlay: true });

    await new Promise((resolve, reject) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (__DEV__) {
          if (status?.isLoaded) {
            console.log("[TTS] status", {
              isPlaying: status.isPlaying,
              positionMillis: status.positionMillis,
              durationMillis: status.durationMillis,
              didJustFinish: status.didJustFinish,
            });
          } else if (status && !status.isLoaded && status.error) {
            console.log("[TTS] error status", status.error);
          }
        }
        if (!status) return;
        if (status.isLoaded && status.didJustFinish) {
          resolve();
        } else if (!status.isLoaded && status.error) {
          reject(new Error(status.error));
        }
      });
    });
  } catch (e) {
    if (__DEV__) console.error("[TTS] playTts failed", e);
    throw e;
  } finally {
    if (sound) {
      try {
        await sound.unloadAsync();
        if (__DEV__) console.log("[TTS] unloaded");
      } catch {}
    }
  }
}
