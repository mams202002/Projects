require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.INSEE_API_KEY;

if (!API_KEY) {
    console.error("❌ ERREUR : La variable INSEE_API_KEY est absente du .env");
    process.exit(1);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/commerces', async (req, res) => {
    // 1. Filtre Géographique : 1er au 5ème arrondissement
    // On utilise l'énumération explicite, c'est la méthode la plus stable pour l'API.
    const arrondissements = '(codePostalEtablissement:75001 OR codePostalEtablissement:75002 OR codePostalEtablissement:75003 OR codePostalEtablissement:75004 OR codePostalEtablissement:75005)';
    
    // 2. Filtre Etat : Uniquement les établissements ouverts (A = Actif)
    const etat = 'etatAdministratifEtablissement:A';
    
    // 3. Mot-clé : SENEGAL
    const keyword = 'denominationUniteLegale:SENEGAL';

    // Construction de la requête finale
    const q = `${keyword} AND ${arrondissements} AND ${etat}`;

    try {
        const url = `https://api.insee.fr/api-sirene/3.11/siret?q=${encodeURIComponent(q)}&nombre=100`;
        
        console.log(`📡 Requête envoyée : ${url}`);

        const response = await axios.get(url, {
            headers: { 
                'X-INSEE-Api-Key-Integration': API_KEY, 
                'Accept': 'application/json' 
            },
            timeout: 10000 // Sécurité : 10 secondes max
        });

        res.json(response.data.etablissements || []);

    } catch (error) {
        console.error("❌ Erreur API Sirene");
        console.error("Statut :", error.response?.status);
        console.error("Message :", error.response?.data?.header?.message || error.message);

        res.status(error.response?.status || 500).json({ 
            error: "Erreur de récupération", 
            details: error.response?.data?.header?.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur actif : http://localhost:${PORT}`);
});