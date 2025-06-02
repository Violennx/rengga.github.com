const mysql = require("mysql2");

// Konfigurasi koneksi database
const db = mysql.createConnection({
    host: "demo1-violen.l.aivencloud.com",       // Host dari database
    user: "avnadmin",            // Username Anda
    password: "AVNS_4-MOSOik9vfYQUM9MxJ", // Ganti dengan password yang Anda masukkan di MySQL Workbench
    database: "qrcodeku", // Nama database yang Anda buat
    port: 19997               // Port default MySQL
});

db.connect(err => {
    if (err) {
        console.error("Gagal terhubung ke database: " + err.message);
        process.exit();
    }
    console.log("Terhubung ke database!");
});

module.exports = {
    url: process.env.service_URI // Ekspor koneksi untuk digunakan di server.js

}


