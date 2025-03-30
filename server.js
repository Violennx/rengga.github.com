const express = require("express");
const QRCode = require("qrcode"); // Untuk generate QR Code
const path = require("path");
const app = express();
const db = require("./db");
const cors = require('cors');



// Simpan token dan status penggunaannya
let tokens = {
    "UNIK12345": false,
    "UNIK67890": false
};

// Middleware untuk parsing data JSON
app.use(express.json());

// Endpoint untuk validasi token
app.get("/validate", (req, res) => {
    const token = req.query.token;

    if (!token || !tokens.hasOwnProperty(token)) {
        return res.status(400).json({ valid: false, message: "Token tidak valid!" });
    }

    if (tokens[token]) {
        return res.status(403).json({ valid: false, message: "QR Code sudah digunakan!" });
    }

    // Tandai token sebagai sudah digunakan
    tokens[token] = true;
    res.json({ valid: true, message: "Token valid, selamat datang!" });
});

app.use(cors({
    origin: 'https://violennx.github.io/rengga.github.com/', // Ganti dengan URL frontend Anda
}));

// Endpoint untuk generate QR Code
app.get("/generate", async (req, res) => {
    const token = req.query.token;

    if (!token || !tokens.hasOwnProperty(token)) {
        return res.status(400).send("Token tidak valid untuk QR Code!");
    }

    try {
        // Generate URL dengan token
        const url = `http://localhost:3000/?token=${token}`;
        const qrCode = await QRCode.toDataURL(url); // Generate QR Code

        res.send(`
            <h1>QR Code untuk ${token}</h1>
            <img src="${qrCode}" alt="QR Code">
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Gagal membuat QR Code!");
    }
});

// Middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, "public")));





// Endpoint untuk pengujian koneksi
app.get("/test-db", (req, res) => {
    db.query("SELECT 1 + 1 AS result", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Kesalahan saat mengakses database!");
        }
        res.send(`Hasil tes database: ${results[0].result}`);
    });
});


// Endpoint untuk menyimpan kode unik
app.post("/add-token", (req, res) => {
    console.log(req.body);
    
    const { token } = req.body;
    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    db.query("INSERT INTO tokens (tokens, is_used) VALUES (?, ?)", [token, false], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Gagal menyimpan kode unik ke database!");
        }
        res.send("Kode unik berhasil disimpan!");
    });
});

app.post("/validate-token", (req, res) => {
    const { token } = req.body; // Ambil kode unik dari body request

    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    // Query untuk mengecek apakah kode unik valid
    db.query("SELECT * FROM tokens WHERE tokens = ?", [token], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Gagal memvalidasi kode unik!");
        }

        if (results.length === 0) {
            // Jika kode tidak ditemukan di database
            return res.status(404).send("Kode unik tidak ditemukan!");
        }

        if (results[0].is_used) {
            // Jika kode sudah digunakan
            return res.status(403).send("Kode unik sudah digunakan!");
        }

        // Jika kode valid, tandai sebagai sudah digunakan
        db.query("UPDATE tokens SET is_used = TRUE WHERE tokens = ?", [token], (err) => {
            if (err) {
                console.error(err);
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
