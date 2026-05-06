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
    restaurants:  ['5610A', '5610B', '5610C', '5621Z', '5629A', '5629B', '5630Z'],
    associations: ['9499Z', '9412Z', '9411Z', '9420Z', '9491Z', '9492Z'],
    commerces:    ['4711A', '4711B', '4719A', '4719B', '4721Z', '4789Z', '4791A'],
    coiffure:     ['9602A', '9602B'],
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