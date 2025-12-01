// server.js (예: Express)
require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const textToSpeech = require("@google-cloud/text-to-speech");

const app = express();
app.use(cors());
const client = new textToSpeech.TextToSpeechClient();

app.get("/tts", async (req, res) => {
  try {
    const text = req.query.text || "안녕하세요, 저는 비유입니다!";

    // 쿼리에서 음성 옵션 받기 (없으면 기본값)
    const voiceName = req.query.voice || "ko-KR-Standard-D";
    const speakingRate = parseFloat(req.query.rate) || 1.0; // 0.25 ~ 4.0
    const pitch = parseFloat(req.query.pitch) || 0.0; // -20.0 ~ 20.0
    const volumeGainDb = parseFloat(req.query.volume) || 0.0; // -96.0 ~ 16.0

    const request = {
      input: { text },
      voice: {
        languageCode: "ko-KR",
        name: voiceName, // 특정 음성 선택 (Neural2, WaveNet, Standard 등)
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: speakingRate, // 말하기 속도
        pitch: pitch, // 음높이
        volumeGainDb: volumeGainDb, // 볼륨
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    // Buffer를 base64 문자열로 명시적 변환
    const audioBase64 = response.audioContent.toString("base64");

    res.json({
      audioContent: audioBase64, // base64 문자열
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "TTS failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TTS server listening on ${PORT}`));
