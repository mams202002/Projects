require('dotenv').config();
const axios = require('axios');

async function testV311() {
    console.log("Tentative sur l'API Sirene V3.11...");
    
    try {
        const res = await axios.get('https://api.insee.fr/entreprises/sirene/V3.11/siret?q=periode(etatAdministratifEtablissement:A)&nombre=1', {
            headers: { 
                'X-INSEE-Api-Key-Integration': process.env.INSEE_API_KEY,
                'Accept': 'application/json'
            }
        });

        console.log("✅ CONNEXION RÉUSSIE !");
        console.log("Donnée reçue :", res.data.etablissements[0].uniteLegale.denominationUniteLegale);
    } catch (err) {
        if (err.response) {
            console.error(`❌ ERREUR API : ${err.response.status}`);
            console.error("Message :", err.response.data.header ? err.response.data.header.message : err.response.data);
        } else {
            console.error("❌ ERREUR RÉSEAU :", err.message);
        }
    }
}

testV311();