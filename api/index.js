
const express = require("express");
const QRCode = require("qrcode"); // Untuk generate QR Code
const path = require("path");
const app = express();
const db = require("../db");
const cors = require("cors");

app.use(cors({
    origin: ["http://localhost:3000", "https://backend-phi-ruby.vercel.app", "https://frontend-rho-five-11.vercel.app"], // Ganti dengan URL frontend asli
    credentials: true
}));

// Middleware untuk parsing data JSON
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));



// Tambah endpoint root "/" untuk match dengan frontend
app.post("/", (req, res) => {
    const { token } = req.body;
    console.log("Token yang diterima:", token);

    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    db.query("SELECT * FROM qrcodeku.tokens WHERE kode = ?", [token], (err, results) => {
        if (err) {
            console.error("Error validasi token:", err.message);
            return res.status(500).send("Gagal memvalidasi kode unik!");
        }

        if (results.length === 0) {
            return res.status(404).send("Kode unik tidak ditemukan!");
        }

        if (results[0].is_used) {
            return res.status(403).send("Kode unik sudah digunakan!");
        }

        db.query("UPDATE qrcodeku.tokens SET is_used = TRUE WHERE kode = ?", [token], (err) => {
            if (err) {
                console.error("Error update token:", err.message);
                return res.status(500).send("Gagal memperbarui status kode unik!");
            }
            res.send("Kode unik valid dan berhasil digunakan!");
        });
    });
});



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

app.post("/api/redeem", (req, res) => {
    const { code } = req.body;
    console.log("=== DEBUG REDEEM ===");
    console.log("Code yang diterima:", code);
    console.log("Request body:", req.body);

    if (!code) {
        console.log("Code kosong!");
        return res.status(400).json({ message: "Code tidak boleh kosong!" });
    }

    // Debug query
    console.log("Menjalankan query SELECT...");
    db.query("SELECT * FROM qrcodeku.tokens WHERE kode = ?", [code], (err, results) => {
        if (err) {
            console.error("Error SELECT query:", err.message);
            return res.status(500).json({ message: "Gagal memvalidasi code!" });
        }

        console.log("Query results:", results);
        console.log("Results length:", results.length);

        if (results.length === 0) {
            console.log("Code tidak ditemukan di database");
            return res.status(404).json({ message: "Code tidak ditemukan!" });
        }

        console.log("Token data:", results[0]);
        console.log("is_used value:", results[0].is_used);
        console.log("is_used type:", typeof results[0].is_used);

        if (results[0].is_used) {
            console.log("Code sudah digunakan");
            return res.status(403).json({ message: "Code sudah digunakan!" });
        }

        // Debug UPDATE query
        console.log("Menjalankan query UPDATE...");
        db.query("UPDATE qrcodeku.tokens SET is_used = TRUE WHERE kode = ?", [code], (err) => {
            if (err) {
                console.error("Error UPDATE query:", err.message);
                return res.status(500).json({ message: "Gagal memperbarui status code!" });
            }
            console.log("UPDATE berhasil");
            res.json({ message: "Code valid dan berhasil digunakan!" });
        });
    });
});


app.get("/debug-table", (req, res) => {
    db.query("DESCRIBE qrcodeku.tokens", (err, results) => {
        if (err) {
            console.error("Error DESCRIBE:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ table_structure: results });
    });
});

app.get("/debug-data", (req, res) => {
    db.query("SELECT * FROM qrcodeku.tokens LIMIT 5", (err, results) => {
        if (err) {
            console.error("Error SELECT:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ sample_data: results });
    });
});

app.get("/debug-db", (req, res) => {
    res.json({
        host: process.env.DB_HOST || "Not set",
        user: process.env.DB_USER || "Not set", 
        database: process.env.DB_NAME || "Not set",
        port: process.env.DB_PORT || "Not set",
        password_set: !!process.env.DB_PASSWORD
    });
});


// Tambahkan di api/index.js
app.post("/api/test", (req, res) => {
    const { code } = req.body;
    res.json({ 
        message: `Test berhasil! Code yang diterima: ${code}`,
        timestamp: new Date().toISOString()
    });
});


app.get("/", (req, res) => {
    res.send("Backend berjalan dengan baik!");
});

const port = process.env.PORT || 3000; // Gunakan port dari environment variable atau default 3000

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});

// Jalankan server
module.exports = app;
