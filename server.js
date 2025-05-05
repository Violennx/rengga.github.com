const express = require("express");
const QRCode = require("qrcode"); // Untuk generate QR Code
const path = require("path");
const app = express();
const fs = require("fs");
const { parse } = require ("csv-parse");


const csvFilePath = path.join(__dirname, "data1.csv");


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



// Endpoint untuk menyimpan kode unik
app.post("/add-token", (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    const newEntry = `${token},FALSE\n`; // Tambahkan token dan status belum digunakan
    fs.appendFile(csvFilePath, newEntry, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Gagal menyimpan token ke CSV!");
        }
        res.send("Kode unik berhasil disimpan!");
    });
});



// Endpoint untuk validasi token
app.post("/validate-token", (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    fs.readFile(csvFilePath, "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Gagal membaca CSV!");
        }

        parse(data, { columns: true }, (err, records) => {
            if (err) return res.status(500).send("Gagal memproses CSV!");

            const foundToken = records.find((row) => row.token === token);
            if (!foundToken) {
                return res.status(404).send("Kode unik tidak ditemukan!");
            }

            if (foundToken.is_used === "TRUE") {
                return res.status(403).send("Kode unik sudah digunakan!");
            }

            res.send("Kode unik valid dan berhasil digunakan!");
        });
    });
});


app.post("/use-token", (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).send("Token tidak boleh kosong!");
    }

    // Baca file CSV
    fs.readFile(csvFilePath, "utf8", (err, data) => {
        if (err) return res.status(500).send("Gagal membaca CSV!");

        parse(data, { columns: true }, (err, records) => {
            if (err) return res.status(500).send("Gagal memproses CSV!");

            const foundToken = records.find((row) => row.token === token);
            if (!foundToken) {
                return res.status(404).send("Kode unik tidak ditemukan!");
            }

            if (foundToken.is_used === "TRUE") {
                return res.status(403).send("Kode unik sudah digunakan!");
            }

            // Update status token dalam CSV
            foundToken.is_used = "TRUE";

            // Konversi kembali ke format CSV
            let updatedCsv = "token,is_used\n" + records.map(row => `${row.token},${row.is_used}`).join("\n");

            // Simpan perubahan ke CSV
            fs.writeFile(csvFilePath, updatedCsv, (err) => {
                if (err) return res.status(500).send("Gagal memperbarui CSV!");
                res.send("Kode unik valid dan berhasil digunakan!");
            });
        });
    });
});

app.post("/api/redeem", (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).send("Kode tidak boleh kosong!");
    }

    fs.readFile(csvFilePath, "utf8", (err, data) => {
        if (err) return res.status(500).send("Gagal membaca CSV!");

        parse(data, { columns: true }, (err, records) => {
            if (err) return res.status(500).send("Gagal memproses CSV!");

            const foundCode = records.find((row) => row.token === code);
            if (!foundCode) {
                return res.status(404).send("Kode tidak ditemukan!");
            }

            if (foundCode.is_used === "TRUE") {
                return res.status(403).send("Kode sudah digunakan!");
            }

            // Update status token dalam CSV
            foundCode.is_used = "TRUE";

            // Simpan kembali ke CSV
            let updatedCsv = "token,is_used\n" + records.map(row => `${row.token},${row.is_used}`).join("\n");

            fs.writeFile(csvFilePath, updatedCsv, (err) => {
                if (err) return res.status(500).send("Gagal memperbarui CSV!");
                res.json({ message: "Kode berhasil digunakan!" });
            });
        });
    });
});




// Jalankan server
app.listen(3000, () => {
    console.log("Server berjalan di https://rengga-github-p8wmg8v00-renggas-projects-89844fb7.vercel.app/");
});