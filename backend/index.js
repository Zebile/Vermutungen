const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database(path.join(__dirname, "data.db"));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taeter TEXT,
    betroffener TEXT,
    umfeld TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.post("/api/vote", (req, res) => {
  const { taeter, betroffener, umfeld } = req.body;

  db.run("INSERT INTO votes (taeter, betroffener, umfeld) VALUES (?, ?, ?)", [taeter, betroffener, umfeld], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Erfasst" });
  });
});

app.get("/api/results", (req, res) => {
  db.all("SELECT * FROM votes WHERE created_at >= datetime('now', '-2 hours')", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const stats = {
      taeter: { maennlich: 0, weiblich: 0 },
      betroffener: { junge: 0, maedchen: 0 },
      umfeld: { nah: 0, fern: 0 },
    };

    rows.forEach((r) => {
      if (r.taeter in stats.taeter) stats.taeter[r.taeter]++;
      if (r.betroffener in stats.betroffener) stats.betroffener[r.betroffener]++;
      if (r.umfeld in stats.umfeld) stats.umfeld[r.umfeld]++;
    });

    res.json(stats);
  });
});

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));

const ExcelJS = require("exceljs");

app.get("/api/export", (req, res) => {
  db.all("SELECT * FROM votes WHERE created_at >= datetime('now', '-2 hours')", async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Umfrage-Ergebnisse");

    sheet.columns = [
      { header: "ID", key: "id" },
      { header: "Tätergeschlecht", key: "taeter" },
      { header: "Betroffener", key: "betroffener" },
      { header: "Umfeld", key: "umfeld" },
      { header: "Zeitpunkt", key: "created_at" }
    ];

    sheet.addRows(rows);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=umfrage_ergebnisse.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  });
});
