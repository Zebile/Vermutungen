const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');

const app = express();
const db = new sqlite3.Database('./data.db');
const PORT = process.env.PORT || 3000;

db.run(`CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY,
  gender_perp TEXT, gender_victim TEXT, relation TEXT,
  ts INTEGER
)`);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.post('/vote', (req, res) => {
  const { gender_perp, gender_victim, relation } = req.body;
  const ts = Date.now();
  db.run(`INSERT INTO votes (gender_perp, gender_victim, relation, ts) VALUES (?,?,?,?)`,
    [gender_perp, gender_victim, relation, ts],
    err => err ? res.status(500).send(err) : res.sendStatus(200));
});

app.get('/results', (req, res) => {
  const cutoff = Date.now() - 2*60*60*1000;
  db.run(`DELETE FROM votes WHERE ts < ?`, cutoff);
  db.all(`SELECT gender_perp, gender_victim, relation, COUNT(*) as count 
          FROM votes 
          WHERE ts >= ?
          GROUP BY gender_perp, gender_victim, relation`, [cutoff], (err, rows) => {
    if(err) return res.status(500).send(err);
    const agg = {
      männlich:0, weiblich:0,
      Junge:0, Mädchen:0,
      nah:0, fern:0
    };
    rows.forEach(r => {
      agg[r.gender_perp] = (agg[r.gender_perp]||0) + r.count;
      agg[r.gender_victim] = (agg[r.gender_victim]||0) + r.count;
      agg[r.relation] = (agg[r.relation]||0) + r.count;
    });
    res.json(agg);
  });
});

app.get('/export', async (req, res) => {
  const cutoff = Date.now() - 2*60*60*1000;
  const rows = await new Promise((resolve, reject) => 
    db.all(`SELECT * FROM votes WHERE ts >= ?`, cutoff, (e,rows) => e ? reject(e) : resolve(rows))
  );
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('votes');
  ws.addRow(['id','gender_perp','gender_victim','relation','timestamp']);
  rows.forEach(v => ws.addRow([v.id, v.gender_perp, v.gender_victim, v.relation, new Date(v.ts).toISOString()]));
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition','attachment; filename="votes.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
