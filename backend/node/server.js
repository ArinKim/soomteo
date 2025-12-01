require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const textToSpeech = require("@google-cloud/text-to-speech");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "15mb" }));
const ttsClient = new textToSpeech.TextToSpeechClient();

// DB config
const dbConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3307),
  user: process.env.MYSQL_USER || "soomteo",
  password: process.env.MYSQL_PASSWORD || "soomteo",
  database: process.env.MYSQL_DATABASE || "soomteo",
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;
let hasMimeColumn = false;
let tableName = process.env.USER_TABLE || "users";
// Reuse existing column name and convert its type to BLOB
let imageColumnName = process.env.PROFILE_IMAGE_COLUMN || "profile_image_url";
let mimeColumnName =
  process.env.PROFILE_IMAGE_MIME_COLUMN || "profile_image_mime";

async function columnExists(table, column) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [dbConfig.database, table, column]
  );
  return rows[0].cnt > 0;
}

async function ensureColumn(table, column, ddl) {
  const exists = await columnExists(table, column);
  if (!exists) {
    try {
      await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    } catch (e) {
      if (!String(e.message).includes("Duplicate column name")) {
        console.warn("Column migration note:", e.message);
      }
    }
  }
}

async function init() {
  pool = await mysql.createPool(dbConfig);

  // Convert existing profile_image_url to LONGBLOB (reuse column name)
  try {
    await pool.query(
      `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${imageColumnName}\` LONGBLOB NULL`
    );
  } catch (e1) {
    // Some MySQL variants accept MODIFY without COLUMN keyword
    try {
      await pool.query(
        `ALTER TABLE \`${tableName}\` MODIFY \`${imageColumnName}\` LONGBLOB NULL`
      );
    } catch (e2) {
      // If column didn't exist, create it
      const exists = await columnExists(tableName, imageColumnName);
      if (!exists) {
        await ensureColumn(
          tableName,
          imageColumnName,
          `\`${imageColumnName}\` LONGBLOB NULL`
        );
      } else {
        console.warn("Column migration note:", e2.message || e1.message);
      }
    }
  }

  // Ensure optional mime column exists
  await ensureColumn(
    tableName,
    mimeColumnName,
    `\`${mimeColumnName}\` VARCHAR(64) NULL`
  );
  hasMimeColumn = await columnExists(tableName, mimeColumnName);
}

// Upload/Update profile image
app.post("/api/user/profile-image", async (req, res) => {
  const { userId, imageBase64, mimeType } = req.body || {};
  if (!userId || !imageBase64) {
    return res
      .status(400)
      .json({ error: "userId and imageBase64 are required" });
  }
  try {
    const buffer = Buffer.from(imageBase64, "base64");
    let result;
    if (hasMimeColumn) {
      [result] = await pool.query(
        `UPDATE \`${tableName}\` SET \`${imageColumnName}\` = ?, \`${mimeColumnName}\` = ? WHERE \`id\` = ?`,
        [buffer, mimeType || "image/jpeg", userId]
      );
    } else {
      [result] = await pool.query(
        `UPDATE \`${tableName}\` SET \`${imageColumnName}\` = ? WHERE \`id\` = ?`,
        [buffer, userId]
      );
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to store image" });
  }
});

// Get profile image as binary
app.get("/api/user/:id/profile-image", async (req, res) => {
  try {
    const userId = req.params.id;
    const selectSql = hasMimeColumn
      ? `SELECT \`${imageColumnName}\` AS img, \`${mimeColumnName}\` AS mime FROM \`${tableName}\` WHERE \`id\` = ?`
      : `SELECT \`${imageColumnName}\` AS img FROM \`${tableName}\` WHERE \`id\` = ?`;
    const [rows] = await pool.query(selectSql, [userId]);
    if (!rows || rows.length === 0 || !rows[0].img) {
      return res.status(404).send("Not Found");
    }
    const mime = hasMimeColumn ? rows[0].mime || "image/jpeg" : "image/jpeg";
    res.setHeader("Content-Type", mime);
    return res.send(rows[0].img);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Server Error");
  }
});

const PORT = Number(process.env.PORT || 3001);
init()
  .then(() => {
    // TTS endpoint (merged from tts.js)
    app.get("/tts", async (req, res) => {
      try {
        const text = req.query.text || "안녕하세요, 저는 비유입니다!";
        const voiceName = req.query.voice || "ko-KR-Standard-D";
        const speakingRate = parseFloat(req.query.rate) || 1.0; // 0.25 ~ 4.0
        const pitch = parseFloat(req.query.pitch) || 0.0; // -20.0 ~ 20.0
        const volumeGainDb = parseFloat(req.query.volume) || 0.0; // -96.0 ~ 16.0

        const languageCode =
          (voiceName.match(/^([a-z]{2}-[A-Z]{2})/) || [])[1] || "ko-KR";

        const request = {
          input: { text },
          voice: {
            languageCode,
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate,
            pitch,
            volumeGainDb,
          },
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBase64 = response.audioContent.toString("base64");
        res.json({ audioContent: audioBase64 });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "TTS failed" });
      }
    });

    app.listen(PORT, () => console.log(`[api] listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to init DB pool", err);
    process.exit(1);
  });
