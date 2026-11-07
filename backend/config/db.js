const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi koneksi ke database (Otomatis mendeteksi Aiven Cloud & SSL atau Laragon Lokal)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lost_and_found_kampus',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Jika terhubung ke Aiven atau cloud host, aktifkan SSL
if (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com')) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

// Uji koneksi awal
pool.getConnection()
  .then((conn) => {
    console.log(`✓ Terhubung ke database MySQL (${dbConfig.host}:${dbConfig.port} / ${dbConfig.database})`);
    conn.release();
  })
  .catch((err) => {
    console.error('✗ Gagal koneksi ke database:', err.message);
  });

module.exports = pool;
