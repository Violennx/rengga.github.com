const express = require("express");
const QRCode = require("qrcode"); // Untuk generate QR Code
const path = require("path");
const app = express();
const db = require("./db");

// Middleware untuk parsing data JSON
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// Endpoint untuk pengujian koneksi database
app.get("/test-db", (req, res) => {
    db.query("SELECT 1 + 1 AS result", (err, results) => {
        if (err) {
            console.error("Kesalahan akses database:", err.message);
            return res.status(500).send("Kesalahan saat mengakses database!");
        }
        res.send(`Hasil tes database: ${results[0].result}`);
    });
});

// Endpoint untuk menyimpan kode unik ke database
app.post("/add-token", (req, res) => {
    console.log("Data request:", req.body);
    
    const { token } = req.body;
    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    db.query("INSERT INTO qrcodeku.tokens (kode, is_used) VALUES (?, ?)", [token, false], (err, results) => {
        if (err) {
            console.error("Gagal menyimpan kode unik:", err.message);
            return res.status(500).send("Gagal menyimpan kode unik ke database!");
        }
        res.send("Kode unik berhasil disimpan!");
    });
});

// Endpoint untuk validasi kode unik
app.post("/validate-token", (req, res) => {
    const { token } = req.body; // Ambil kode unik dari body request
    console.log("Token yang diterima:", token); // Debugging log

    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    // Query untuk mengecek apakah kode unik valid
    db.query("SELECT * FROM qrcodeku.tokens WHERE kode = ?", [token], (err, results) => {
        if (err) {
            console.error("Error validasi token:", err.message);
            return res.status(500).send("Gagal memvalidasi kode unik!");
        }

        console.log("Hasil query dari database:", results); // Debugging log

        if (results.length === 0) {
            return res.status(404).send("Kode unik tidak ditemukan!");
        }

        if (results[0].is_used) {
            return res.status(403).send("Kode unik sudah digunakan!");
        }

        // Jika kode valid, tandai sebagai sudah digunakan
        db.query("UPDATE qrcodeku.tokens SET is_used = TRUE WHERE kode = ?", [token], (err) => {
            if (err) {
                console.error("Error update token:", err.message);
                return res.status(500).send("Gagal memperbarui status kode unik!");
            }
            res.send("Kode unik valid dan berhasil digunakan!");
        });
    });
});

// Jalankan server
app.listen(3000, () => {
    console.log("Server berjalan di http://localhost:3000");
});
