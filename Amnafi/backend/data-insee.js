require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

const API_KEY = process.env.INSEE_API_KEY;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/commerces', async (req, res) => {
    // Version ultra-brute : pas de parenthèses, pas d'étoiles.
    // On cherche "SENEGAL" dans le texte libre de l'établissement au code postal 75018.
    const arrondissements = ['75*'];
    const zipQuery = arrondissements.join(' OR ');
    const KEYWORDS = ['SENEGAL', 'DAKAR'];
    const keywordQuery = KEYWORDS.map(k => `denominationUniteLegale:*${k}*`).join(' OR ');
    const q = `(${keywordQuery}) AND codePostalEtablissement:(${zipQuery})`;
    

    try {
        const response = await axios.get("https://api.insee.fr/api-sirene/3.11/siret", {
            headers: { 
                'X-INSEE-Api-Key-Integration': API_KEY, 
                'Accept': 'application/json' 
            },
            params: { q, nombre: 1000 }
        });

        console.log(`✅ Connexion réussie !`);
        res.json(response.data.etablissements || []);

    } catch (error) {
        console.error("❌ ÉCHEC :");
        if (error.response) {
            console.error("Détail INSEE :", error.response.data.header);
            // Si l'erreur persiste, on logge l'URL exacte générée par Axios
            console.error("URL testée :", error.config.url + "?q=" + encodeURIComponent(q));
        }
        res.status(400).json({ error: "Syntaxe rejetée" });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Serveur actif : http://localhost:${PORT}`);
});