const mysql = require("mysql2");

// Konfigurasi koneksi database menggunakan environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST || "demo1-violen.l.aivencloud.com",
    user: process.env.DB_USER || "avnadmin",
    password: process.env.DB_PASSWORD || "AVNS_4-MOSOik9vfYQUM9MxJ",
    database: process.env.DB_NAME || "qrcodeku",
    port: process.env.DB_PORT || 19997,
    ssl: {
        rejectUnauthorized: false // Untuk cloud database seperti Aiven
    }
});

db.connect(err => {
    if (err) {
        console.error("Gagal terhubung ke database: " + err.message);
        console.error("Error details:", err);
        // Jangan exit di production, biarkan app tetap jalan
        return;
    }
    console.log("Terhubung ke database!");
});

// Handle connection errors
db.on('error', (err) => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        // Reconnect logic bisa ditambahkan di sini
        console.log('Database connection lost, attempting to reconnect...');
    }
});

// Ekspor connection object
module.exports = db;
