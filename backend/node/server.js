// backend/server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // DB 연결

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL 연결
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  // host: process.env.DB_HOST || 'mysql', -> 추후 연결
  user: process.env.DB_USER || 'soomter',
  password: process.env.DB_PASS || 'soomter',
  database: process.env.DB_NAME || 'soomter',
});

// 루트 API
app.get('/', (req, res) => {
  res.send('Node.js server is running!');
});

// 테스트 API
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Node.js!' });
});

// DB API 예시
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
