require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.INSEE_API_KEY;
if (!API_KEY) {
    console.error("❌ ERREUR CRITIQUE : INSEE_API_KEY manquante dans le .env");
    process.exit(1);
}

const KEYWORDS = ['SENEGAL', 'DAKAR', 'TERANGA', 'YASSA', 'MAFE', 'THIEB', 'DIBI', 'BISSAP', 'CASAMANCE', 'GOREE', 'NDAKARU'];

const CATEGORIES = {
    restaurants:  ['56.10A', '56.10B', '56.10C', '56.21Z', '56.29A', '56.29B', '56.30Z'],
    associations: ['94.99Z', '94.12Z', '94.11Z', '94.20Z', '94.91Z', '94.92Z'],
    commerces:    ['47.11A', '47.11B', '47.19A', '47.19B', '47.21Z', '47.89Z', '47.91A'],
    coiffure:     ['96.02A', '96.02B'],
};

// Fusion de tous les codes NAF en une seule liste pour la requête globale
const ALL_NAF = Object.values(CATEGORIES).flat();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/commerces', async (req, res) => {
    // Permet de passer des départements via l'URL (ex: ?deps=75,92,93), sinon utilise 75 et 92 par défaut
    const depsParam = req.query.deps ? req.query.deps.split(',') : ['75', '92'];
    const zipQuery = depsParam.map(d => `codePostalEtablissement:${d}*`).join(' OR ');

    // Note : Retrait du joker de début (*) si l'API rejette la recherche leading-wildcard
    const keywordQuery = KEYWORDS.map(k => `denominationUniteLegale:${k}`).join(' OR ');
    
    // Ajout du filtre NAF (activitePrincipaleEtablissement)
    const nafQuery = ALL_NAF.map(n => `activitePrincipaleEtablissement:${n}`).join(' OR ');

    const q = `(${keywordQuery}) AND (${zipQuery}) AND (${nafQuery})`;

    try {
        const response = await axios.get("https://api.insee.fr/api-sirene/3.11/siret", {
            headers: {
                'X-INSEE-Api-Key-Integration': API_KEY,
                'Accept': 'application/json'
            },
            params: { q, nombre: 500 }
        });

        console.log(`✅ Connexion réussie ! Total trouvés : ${response.data.header?.total}`);
        res.json(response.data.etablissements || []);

    } catch (error) {
        console.error("❌ ÉCHEC REQUÊTE INSEE :");
        if (error.response) {
            console.error("Status :", error.response.status);
            console.error("Détail :", JSON.stringify(error.response.data?.header || error.response.data));
        } else {
            console.error("Message :", error.message);
        }
        res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur actif : http://localhost:${PORT}`);
});