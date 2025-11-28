// STT 모듈을 안전하게 관리
let SpeechRecognition = null;
let isModuleLoaded = false;

export const initSpeechRecognition = async () => {
  if (isModuleLoaded) {
    return SpeechRecognition;
  }

  try {
    const module = require("expo-speech-recognition");

    // 모듈이 실제로 사용 가능한지 확인
    if (
      module &&
      module.isSpeechRecognitionAvailable &&
      module.startSpeechRecognitionAsync &&
      module.stopSpeechRecognitionAsync
    ) {
      SpeechRecognition = module;
      isModuleLoaded = true;
      console.log("✓ STT 모듈 정상 로드됨");
      return SpeechRecognition;
    } else {
      console.warn("⚠️ STT 모듈이 불완전함 (필수 메서드 누락)");
      return null;
    }
  } catch (err) {
    console.warn("⚠️ STT 모듈 로드 실패:", err.message);
    return null;
  }
};

export const getSpeechRecognition = () => {
  return SpeechRecognition;
};

export const isSpeechRecognitionAvailable = () => {
  return SpeechRecognition !== null && isModuleLoaded;
};
