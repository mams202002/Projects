require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.INSEE_API_KEY;

async function fetchAmnafi() {
    // L'URL exacte du mode d'emploi
    const API_URL = "https://api.insee.fr/api-sirene/3.11/siret";

    console.log("🚀 Connexion à l'API Sirene via X-INSEE-Api-Key-Integration...");

    try {
        const response = await axios.get(API_URL, {
            headers: { 
                'X-INSEE-Api-Key-Integration': API_KEY,
                'Accept': 'application/json' 
            },
            params: { 
                q: 'denominationUniteLegale:*SENEGAL* AND codePostalEtablissement:75018',
                nombre: 10 
            }
        });

        const data = response.data?.etablissements || [];
        console.log(`✅ Succès ! ${data.length} établissements trouvés.`);

        data.forEach(e => {
            console.log(`- ${e.uniteLegale.denominationUniteLegale}`);
        });

    } catch (error) {
        console.error("❌ ERREUR :");
        if (error.response) {
            console.error(`Statut : ${error.response.status}`);
            console.log("Détail :", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

fetchAmnafi();