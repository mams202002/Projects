let chartInstance = null;

// 1. Récupérer les données depuis l'API et tout mettre à jour
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();

    // Mettre à jour les KPIs
    document.getElementById('kpi-poids').textContent = data.kpis.totalPoidsKg;
    document.getElementById('kpi-valeur').textContent = data.kpis.totalValeurEuros;
    document.getElementById('kpi-rendement-kg').textContent = data.kpis.rendementKgM2;
    document.getElementById('kpi-rendement-euro').textContent = data.kpis.rendementEurosM2;
    document.getElementById('kpi-surface').textContent = data.kpis.surfaceTotaleM2;

    // Remplir le selecteur de zones (<select id="zoneId">)
    updateZoneSelect(data.zones);

    // Mettre à jour le tableau des récoltes
    updateTableauRecoltes(data.recoltes);

    // Générer le graphique par légume
    updateChart(data.recoltes);

  } catch (err) {
    console.error('Erreur lors de la récupération des stats:', err);
  }
}

// 2. Remplir dynamiquement la liste déroulante des zones
function updateZoneSelect(zones) {
  const selectZone = document.getElementById('zoneId');
  selectZone.innerHTML = ''; // Vider les options actuelles

  if (zones.length === 0) {
    const option = document.createElement('option');
    option.textContent = '-- Aucune zone disponible --';
    selectZone.appendChild(option);
    return;
  }

  zones.forEach(zone => {
    const option = document.createElement('option');
    option.value = zone.id;
    option.textContent = `${zone.nom} (${zone.surface} m²)`;
    selectZone.appendChild(option);
  });
}

// 3. Mettre à jour le tableau HTML des récoltes
function updateTableauRecoltes(recoltes) {
  const tbody = document.getElementById('tableau-recoltes');
  tbody.innerHTML = '';

  // Afficher les plus récentes en premier
  [...recoltes].reverse().forEach(r => {
    const tr = document.createElement('tr');
    const valeurEuros = (r.poidsKg * r.prixKgRef).toFixed(2);
    
    tr.innerHTML = `
      <td>${r.date || '-'}</td>
      <td><strong>${r.legume}</strong></td>
      <td>${r.poidsKg} kg</td>
      <td>${valeurEuros} €</td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. Mettre à jour le graphique Doughnut (Chart.js)
function updateChart(recoltes) {
  const ctx = document.getElementById('chartLegumes').getContext('2d');

  // Calculer les poids totaux par légume
  const totalsParLegume = {};
  recoltes.forEach(r => {
    totalsParLegume[r.legume] = (totalsParLegume[r.legume] || 0) + r.poidsKg;
  });

  const labels = Object.keys(totalsParLegume);
  const dataValues = Object.values(totalsParLegume);

  // Détruire l'ancien graphique avant d'en créer un nouveau
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: [
          '#2e7d32', '#4caf50', '#81c784', 
          '#ff9800', '#ffb74d', '#2196f3', '#e91e63'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// 5. Gestion de la soumission du formulaire Récolte
document.getElementById('form-recolte').addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    zoneId: document.getElementById('zoneId').value,
    legume: document.getElementById('legume').value,
    poidsKg: document.getElementById('poidsKg').value,
    prixKgRef: document.getElementById('prixKgRef').value
  };

  const res = await fetch('/api/recoltes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    // Réinitialiser les champs de saisie
    document.getElementById('legume').value = '';
    document.getElementById('poidsKg').value = '';
    
    // Recharger l'affichage
    fetchStats();
  } else {
    alert('Erreur lors de l\'enregistrement de la récolte.');
  }
});

// 6. Gestion de la soumission du formulaire Zone (CORRIGÉ)
document.getElementById('form-zone').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nomInput = document.getElementById('nomZone');
  const surfaceInput = document.getElementById('surfaceZone');

  const payload = {
    nom: nomInput.value,
    surface: surfaceInput.value
  };

  try {
    const res = await fetch('/api/zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      nomInput.value = '';
      surfaceInput.value = '';
      fetchStats(); // Recharge la liste déroulante et les KPIs
    } else {
      const errData = await res.json();
      alert(`Erreur : ${errData.error || 'Impossible de créer la zone'}`);
    }
  } catch (err) {
    console.error('Erreur réseau :', err);
    alert('Erreur de connexion au serveur.');
  }
});
// Chargement au démarrage de la page
fetchStats();