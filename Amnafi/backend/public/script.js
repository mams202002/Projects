const CATEGORIES = {
    restaurants: ['56.10A', '56.10B', '56.10C', '56.21Z', '56.29A', '56.29B', '56.30Z'],
    associations: ['94.99Z', '94.12Z', '94.11Z', '94.20Z', '94.91Z', '94.92Z'],
    commerces: ['47.11A', '47.11B', '47.19A', '47.19B', '47.21Z', '47.89Z', '47.91A'],
    coiffure: ['96.02A', '96.02B']
};

function getCategorie(codeNAF) {
    if (!codeNAF) return 'autres';
    for (const [cat, codes] of Object.entries(CATEGORIES)) {
        if (codes.includes(codeNAF)) return cat;
    }
    return 'autres';
}

let allData = [];
let activeTab = 'tous';

function renderTable(cat) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    const filtered = cat === 'tous' ? allData : allData.filter(e => e._categorie === cat);
    const fragment = document.createDocumentFragment();

    filtered.forEach((etab, index) => {
        const row = document.createElement('tr');
        const adr = etab.adresseEtablissement || {};
        const nomEnseigne = etab.periodesEtablissement?.[0]?.enseigne1Etablissement
            || etab.uniteLegale?.denominationUniteLegale
            || 'Nom inconnu';
        
        const numero = adr.numeroVoieEtablissement || '';
        const typeVoie = adr.typeVoieEtablissement || '';
        const libelleVoie = adr.libelleVoieEtablissement || '';
        const cp = adr.codePostalEtablissement || '';
        const commune = adr.libelleCommuneEtablissement || '';

        // Construction de l'adresse et de la recherche
        const rue = `${numero} ${typeVoie} ${libelleVoie}`.trim();
        const adresseComplete = `${nomEnseigne} ${rue} ${cp} ${commune}`.trim();

        // URLs de recherche Google
        const googleUrlEnseigne = `https://www.google.com/search?q=${encodeURIComponent(nomEnseigne + ' ' + commune)}`;
        const googleUrlAdresse = `https://www.google.com/search?q=${encodeURIComponent(adresseComplete)}`;

        row.innerHTML = `
            <td class="col-index">${index + 1}</td>
            <td class="cell-name">
                <a href="${googleUrlEnseigne}" target="_blank" rel="noopener noreferrer" class="link-google" title="Chercher l'enseigne sur Google"></a>
            </td>
            <td class="cell-address">
                ${rue ? `<a href="${googleUrlAdresse}" target="_blank" rel="noopener noreferrer" class="link-google" title="Chercher l'adresse sur Google">${rue}</a>` : 'Adresse non renseignée'}
            </td>
            <td>${cp || 'N/A'}</td>
            <td><span class="tag-cat">${etab._categorie}</span></td>
        `;

        // Sécurisation de l'injection du nom de l'enseigne
        row.querySelector('.cell-name a').textContent = nomEnseigne;
        fragment.appendChild(row);
    });

    tbody.appendChild(fragment);
}

function updateCounts() {
    const counts = { tous: allData.length, restaurants: 0, associations: 0, commerces: 0, coiffure: 0, autres: 0 };
    allData.forEach(e => { if (counts[e._categorie] !== undefined) counts[e._categorie]++; });
    for (const [cat, count] of Object.entries(counts)) {
        const el = document.getElementById(`count-${cat}`);
        if (el) el.textContent = count;
    }
}

document.getElementById('tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.cat;
    renderTable(activeTab);
});

document.getElementById('btn-load').addEventListener('click', async () => {
    const btn = document.getElementById('btn-load');
    const status = document.getElementById('status-message');

    btn.disabled = true;
    btn.textContent = 'Chargement...';
    status.style.display = 'none';

    try {
        const response = await fetch('/api/commerces');
        if (!response.ok) throw new Error(`Erreur ${response.status}: Service indisponible`);

        let data = await response.json();
        if (data.length === 0) {
            status.textContent = 'Aucun résultat trouvé.';
            status.style.display = 'block';
            return;
        }

        data.forEach(etab => {
            const codeNAF = etab.periodesEtablissement?.[0]?.activitePrincipaleEtablissement;
            etab._categorie = getCategorie(codeNAF);
        });

        data.sort((a, b) => (a.adresseEtablissement?.codePostalEtablissement || '')
            .localeCompare(b.adresseEtablissement?.codePostalEtablissement || ''));

        allData = data;
        updateCounts();
        renderTable('tous');
        document.getElementById('tabs').style.display = 'inline-flex';

    } catch (error) {
        status.textContent = error.message;
        status.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Recharger les données';
    }
});