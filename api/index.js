
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



// Perbaikan untuk endpoint root "/"
app.post("/", (req, res) => {
    const { token } = req.body;
    console.log("Token yang diterima:", token);

    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    // PERBAIKAN: Gunakan 'token' bukan 'kode'
    db.query("SELECT * FROM qrcodeku.tokens WHERE token = ?", [token], (err, results) => {
        if (err) {
            console.error("Error validasi token:", err.message);
            return res.status(500).send("Gagal memvalidasi kode unik!");
        }

        if (results.length === 0) {
            return res.status(404).send("Kode unik tidak ditemukan!");
        }

        const isUsed = results[0].is_used === 1 || results[0].is_used === true || results[0].is_used === '1';
        
        if (isUsed) {
            return res.status(403).send("Kode unik sudah digunakan!");
        }

        // PERBAIKAN: Update juga gunakan 'token'
        db.query("UPDATE qrcodeku.tokens SET is_used = 1 WHERE token = ?", [token], (err) => {
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

app.post("/add-token", (req, res) => {
    console.log("Data request:", req.body);
    
    const { token } = req.body;
    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    // PERBAIKAN: Gunakan 'token' bukan 'kode'
    db.query("INSERT INTO qrcodeku.tokens (token, is_used) VALUES (?, ?)", [token, 0], (err, results) => {
        if (err) {
            console.error("Gagal menyimpan kode unik:", err.message);
            return res.status(500).send("Gagal menyimpan kode unik ke database!");
        }
        res.send("Kode unik berhasil disimpan!");
    });
});

// Endpoint untuk validasi kode unik
// Perbaikan untuk endpoint /validate-token
app.post("/validate-token", (req, res) => {
    const { token } = req.body;
    console.log("Token yang diterima:", token);

    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    // PERBAIKAN: Gunakan 'token' bukan 'kode'
    db.query("SELECT * FROM qrcodeku.tokens WHERE token = ?", [token], (err, results) => {
        if (err) {
            console.error("Error validasi token:", err.message);
            return res.status(500).send("Gagal memvalidasi kode unik!");
        }

        console.log("Hasil query dari database:", results);

        if (results.length === 0) {
            return res.status(404).send("Kode unik tidak ditemukan!");
        }

        const isUsed = results[0].is_used === 1 || results[0].is_used === true || results[0].is_used === '1';
        
        if (isUsed) {
            return res.status(403).send("Kode unik sudah digunakan!");
        }

        // PERBAIKAN: Update juga gunakan 'token'
        db.query("UPDATE qrcodeku.tokens SET is_used = 1 WHERE token = ?", [token], (err) => {
            if (err) {
                console.error("Error update token:", err.message);
                return res.status(500).send("Gagal memperbarui status kode unik!");
            }
            res.send("Kode unik valid dan berhasil digunakan!");
        });
    });
});

// Perbaikan untuk endpoint /api/redeem
app.post("/api/redeem", (req, res) => {
    const { code } = req.body;
    console.log("=== DEBUG REDEEM ===");
    console.log("Code yang diterima:", code);

    if (!code) {
        console.log("Code kosong!");
        return res.status(400).json({ message: "Code tidak boleh kosong!" });
    }

    // PERBAIKAN: Gunakan 'token' bukan 'kode'
    console.log("Menjalankan query SELECT...");
    db.query("SELECT * FROM qrcodeku.tokens WHERE token = ?", [code], (err, results) => {
        if (err) {
            console.error("Error SELECT query:", err.message);
            return res.status(500).json({ message: "Gagal memvalidasi code!" });
        }

        console.log("Query results:", results);
        console.log("Results length:", results.length);

        // Jika tidak ditemukan
        if (results.length === 0) {
            console.log("Code tidak ditemukan di database");
            return res.status(404).json({ message: "Code tidak ditemukan!" });
        }

        console.log("Token data:", results[0]);
        console.log("is_used value:", results[0].is_used);
        
        // Perbaikan pengecekan is_used (handle berbagai tipe data)
        const isUsed = results[0].is_used === 1 || results[0].is_used === true || results[0].is_used === '1';
        
        if (isUsed) {
            console.log("Code sudah digunakan");
            return res.status(403).json({ message: "Code sudah digunakan!" });
        }

        // PERBAIKAN: Update juga gunakan 'token'
        console.log("Menjalankan query UPDATE...");
        db.query("UPDATE qrcodeku.tokens SET is_used = 1 WHERE token = ?", [code], (err) => {
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
