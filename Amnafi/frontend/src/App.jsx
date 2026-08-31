import { useState } from 'react';
import './index.css';

const CATEGORIES = {
  restaurants: ['56.10A', '56.10B', '56.10C', '56.21Z', '56.29A', '56.29B', '56.30Z'],
  associations: ['94.99Z', '94.12Z', '94.11Z', '94.20Z', '94.91Z', '94.92Z'],
  commerces: ['47.11A', '47.11B', '47.19A', '47.19B', '47.21Z', '47.89Z', '47.91A'],
  coiffure: ['96.02A', '96.02B'],
};

function getCategorie(naf) {
  if (!naf) return 'autres';
  const cleanNaf = naf.replace('.', '');
  for (const [cat, codes] of Object.entries(CATEGORIES)) {
    if (codes.some(c => c.replace('.', '') === cleanNaf)) return cat;
  }
  return 'autres';
}

function getNom(e) {
  const ul = e.uniteLegale || {};
  const eAdresse = e.adresseEtablissement || {};
  return (
    eAdresse.enseigne1Etablissement ||
    eAdresse.denominationUsuelleEtablissement ||
    ul.denominationUniteLegale ||
    ul.nomUsageUniteLegale ||
    'Non renseigné'
  );
}

function getAdresse(e) {
  const a = e.adresseEtablissement;
  if (!a) return 'Non renseignée';
  return [a.numeroVoieEtablissement, a.typeVoieEtablissement, a.libelleVoieEtablissement]
    .filter(Boolean)
    .join(' ') || 'Non renseignée';
}

export default function App() {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('tous');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const chargerDonnees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/commerces');
      if (!res.ok) throw new Error('Erreur lors du chargement des données');
      const resultats = await res.json();
      setData(resultats);
      setHasLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const counts = {
    tous: data.length,
    restaurants: data.filter(e => getCategorie(e.uniteLegale?.activitePrincipaleUniteLegale) === 'restaurants').length,
    associations: data.filter(e => getCategorie(e.uniteLegale?.activitePrincipaleUniteLegale) === 'associations').length,
    commerces: data.filter(e => getCategorie(e.uniteLegale?.activitePrincipaleUniteLegale) === 'commerces').length,
    coiffure: data.filter(e => getCategorie(e.uniteLegale?.activitePrincipaleUniteLegale) === 'coiffure').length,
    autres: data.filter(e => getCategorie(e.uniteLegale?.activitePrincipaleUniteLegale) === 'autres').length,
  };

  const filteredData = activeTab === 'tous'
    ? data
    : data.filter(e => getCategorie(e.uniteLegale?.activitePrincipaleUniteLegale) === activeTab);

  const ouvrirGoogle = (nom, adresse, cp) => {
    const query = encodeURIComponent(`${nom} ${adresse} ${cp}`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  return (
    <div className="container">
      <header>
        <h1>AMNAFI</h1>
        <p className="subtitle">Annuaire des établissements et commerces</p>
      </header>

      {error && <div id="status-message" className="error">{error}</div>}

      <div className="controls">
        <button className="btn-primary" onClick={chargerDonnees} disabled={loading}>
          {loading ? 'Chargement...' : 'Charger les données'}
        </button>
      </div>

      {hasLoaded && (
        <div className="tabs-container">
          <div className="tabs" id="tabs">
            {['tous', 'restaurants', 'associations', 'commerces', 'coiffure', 'autres'].map((cat) => (
              <button
                key={cat}
                className={`tab ${activeTab === cat ? 'active' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)} <span className="badge">{counts[cat]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="table-card">
        <table id="resultats">
          <thead>
            <tr>
              <th className="col-index">#</th>
              <th>Enseigne</th>
              <th>Adresse</th>
              <th>CP</th>
              <th>Catégorie</th>
            </tr>
          </thead>
          <tbody id="table-body">
            {filteredData.map((e, index) => {
              const nom = getNom(e);
              const adresse = getAdresse(e);
              const cp = e.adresseEtablissement?.codePostalEtablissement || '-';
              const cat = getCategorie(e.uniteLegale?.activitePrincipaleUniteLegale);

              return (
                <tr 
                  key={e.siren || index} 
                  onClick={() => ouvrirGoogle(nom, adresse, cp)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="col-index">{index + 1}</td>
                  <td><strong>{nom}</strong></td>
                  <td>{adresse}</td>
                  <td>{cp}</td>
                  <td><span className={`badge-cat ${cat}`}>{cat}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}