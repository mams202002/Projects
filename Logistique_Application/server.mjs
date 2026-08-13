import express from 'express';
import fs from 'fs/promises';

const app = express();
app.use(express.json());

const DATA_FILE = './data.json';

// Fonction utilitaire pour lire les données
async function lireDonnees() {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
}

// Fonction utilitaire pour écrire les données
async function ecrireDonnees(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// 1. Voir l'état du stock
app.get('/stock', async (req, res) => {
    const db = await lireDonnees();
    res.json(db.stock);
});

// 2. Voir les commandes à préparer
app.get('/commandes', async (req, res) => {
    const db = await lireDonnees();
    res.json(db.commandes);
});

// 3. Valider/Préparer une commande (Met à jour le stock)
app.post('/commandes/:id/preparer', async (req, res) => {
    const { id } = req.params;
    const db = await lireDonnees();
    
    const commande = db.commandes.find(c => c.id_commande === id);
    if (!commande) return res.status(404).json({ erreur: "Commande introuvable" });
    if (commande.statut === "Préparée") return res.status(400).json({ erreur: "Déjà préparée" });

    // Vérification et mise à jour du stock
    for (const art of commande.articles) {
        const produitStock = db.stock.find(p => p.id === art.id_article);
        if (!produitStock || produitStock.quantite < art.quantite_demandee) {
            return res.status(400).json({ erreur: `Stock insuffisant pour l'article ${art.id_article}` });
        }
        // Déduction du stock
        produitStock.quantite -= art.quantite_demandee;
    }

    commande.statut = "Préparée";
    await ecrireDonnees(db);

    res.json({ message: `Commande ${id} préparée avec succès. Stock mis à jour.`, commande });
});

app.listen(3000, () => console.log('Serveur logistique démarré sur http://localhost:3000'));