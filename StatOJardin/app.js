const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// INITIALISATION DE LA BASE DE DONNÉES SQLITE
// -----------------------------------------------------------------------------
const dbPath = path.join(__dirname, 'potager.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de l\'ouverture de SQLite :', err.message);
  } else {
    console.log('📦 Connecté à la base de données SQLite (potager.db)');
  }
});

// Création des tables si elles n'existent pas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      surface REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recoltes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_id INTEGER NOT NULL,
      legume TEXT NOT NULL,
      poids_kg REAL NOT NULL,
      prix_kg_ref REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (zone_id) REFERENCES zones(id)
    )
  `);
});

// -----------------------------------------------------------------------------
// ROUTES API
// -----------------------------------------------------------------------------

// GET: Récupérer les stats, zones et récoltes
app.get('/api/stats', (req, res) => {
  // 1. Récupérer toutes les zones
  db.all('SELECT * FROM zones', [], (err, zonesRows) => {
    if (err) return res.status(500).json({ error: err.message });

    // 2. Récupérer toutes les récoltes
    db.all('SELECT * FROM recoltes', [], (err, recoltesRows) => {
      if (err) return res.status(500).json({ error: err.message });

      // Formatage des récoltes pour correspondre au frontend
      const recoltes = recoltesRows.map(r => ({
        id: r.id,
        zoneId: r.zone_id,
        legume: r.legume,
        poidsKg: r.poids_kg,
        prixKgRef: r.prix_kg_ref,
        date: r.date
      }));

      // Calculs des KPIs
      let totalPoids = 0;
      let totalValeur = 0;

      recoltes.forEach(r => {
        totalPoids += r.poidsKg;
        totalValeur += (r.poidsKg * r.prixKgRef);
      });

      const surfaceTotale = zonesRows.reduce((acc, z) => acc + z.surface, 0);
      const rendementKgM2 = surfaceTotale > 0 ? (totalPoids / surfaceTotale).toFixed(2) : '0.00';
      const rendementEurosM2 = surfaceTotale > 0 ? (totalValeur / surfaceTotale).toFixed(2) : '0.00';

      res.json({
        kpis: {
          totalPoidsKg: totalPoids.toFixed(2),
          totalValeurEuros: totalValeur.toFixed(2),
          surfaceTotaleM2: surfaceTotale,
          rendementKgM2,
          rendementEurosM2
        },
        recoltes,
        zones: zonesRows
      });
    });
  });
});

// POST: Ajouter une nouvelle récolte
app.post('/api/recoltes', (req, res) => {
  const { zoneId, legume, poidsKg, prixKgRef } = req.body;

  if (!legume || !poidsKg || !prixKgRef || !zoneId) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  const dateToday = new Date().toISOString().split('T')[0];
  const sql = `INSERT INTO recoltes (zone_id, legume, poids_kg, prix_kg_ref, date) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [zoneId, String(legume).trim(), poidsKg, prixKgRef, dateToday], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      zoneId: Number(zoneId),
      legume: String(legume).trim(),
      poidsKg: Number(poidsKg),
      prixKgRef: Number(prixKgRef),
      date: dateToday
    });
  });
});

// POST: Créer une nouvelle zone de culture
app.post('/api/zones', (req, res) => {
  const { nom, surface } = req.body;

  if (!nom || !surface || isNaN(surface) || Number(surface) <= 0) {
    return res.status(400).json({ error: 'Le nom et une surface valide sont requis.' });
  }

  const sql = `INSERT INTO zones (nom, surface) VALUES (?, ?)`;

  db.run(sql, [String(nom).trim(), surface], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      nom: String(nom).trim(),
      surface: Number(surface)
    });
  });
});

// -----------------------------------------------------------------------------
// DÉMARRAGE DU SERVEUR
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});