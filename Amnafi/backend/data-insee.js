require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

const API_KEY = process.env.INSEE_API_KEY;

// --- Mots-clés de recherche ---
const KEYWORDS = ['SENEGAL'];

// --- Codes NAF sans point, exactement comme l'API les retourne ---
const CATEGORIES = {
    restaurants:  ['56.10A', '56.10B', '56.10C', '56.21Z', '56.29A', '56.29B', '56.30Z'],
    associations: ['94.99Z', '94.12Z', '94.11Z', '94.20Z', '94.91Z', '94.92Z'],
    commerces:    ['47.11A', '47.11B', '47.19A', '47.19B', '47.21Z', '47.89Z', '47.91A'],
    coiffure:     ['96.02A', '96.02B'],
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/commerces', async (req, res) => {
    const arrondissements = [
        '75*'
    ];

    const zipQuery     = arrondissements.join(' OR ');
    const keywordQuery = KEYWORDS.map(k => `denominationUniteLegale:*${k}*`).join(' OR ');
    const q = `(${keywordQuery}) AND codePostalEtablissement:(${zipQuery})`;

    try {
        const response = await axios.get("https://api.insee.fr/api-sirene/3.11/siret", {
            headers: {
                'X-INSEE-Api-Key-Integration': API_KEY,
                'Accept': 'application/json'
            },
            params: { q, nombre: 200 }
        });

        console.log(`✅ Connexion réussie ! Total : ${response.data.header?.total}`);

        const etablissements = response.data.etablissements || [];
        res.json(etablissements);

    } catch (error) {
        console.error("❌ ÉCHEC :");
        if (error.response) {
            console.error("Détail INSEE :", error.response.data?.header);
        } else if (error.request) {
            console.error("Pas de réponse du serveur (timeout ou réseau)");
        } else {
            console.error("Erreur inattendue :", error.message);
        }
        res.status(500).json({ error: "Erreur lors de la récupération des données" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur actif : http://localhost:${PORT}`);
});