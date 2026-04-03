require('dotenv').config();
const axios = require('axios');

async function test() {
    console.log("Tentative de connexion avec la clé...");
    
    try {
        // Requête ultra-simple : on demande juste 1 établissement n'importe où
        const res = await axios.get('https://api.insee.fr/entreprises/sirene/V3.11/siret?q=periode(etatAdministratifEtablissement:A)&nombre=1', {
            headers: { 
                'X-INSEE-Api-Key-Integration': process.env.INSEE_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (res.data.etablissements) {
            console.log("✅ SUCCÈS ! Connexion établie.");
            console.log("Exemple de donnée reçue :", res.data.etablissements[0].uniteLegale.denominationUniteLegale);
        }
    } catch (err) {
        console.error("❌ ERREUR :", err.response ? err.response.status : err.message);
        if (err.response && err.response.status === 404) {
            console.log("Conseil : Vérifie que tu as bien souscrit à l'API 'Sirene V3' dans le catalogue de l'INSEE.");
        }
    }
}

test();