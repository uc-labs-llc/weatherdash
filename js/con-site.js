document.addEventListener('DOMContentLoaded', () => {
  // Mock EPA data (replace with Envirofacts API in backend)
  const mockData = [
    { id: 1, name: "Site A", state: "CA", program: "Superfund", contaminants: ["Lead", "PCBs"], lat: 34.05, lng: -118.24, status: "Active", risk: "High", funding: 5.2, jobs: 10, ej: true, cleanup_start: "2018-03-01", cleanup_end: null },
    { id: 2, name: "Site B", state: "NY", program: "Brownfields", contaminants: ["Petroleum"], lat: 40.71, lng: -74.01, status: "Completed", risk: "Low", funding: 1.5, jobs: 25, ej: false, cleanup_start: "2020-06-01", cleanup_end: "2022-09-01" },
    { id: 3, name: "Site C", state: "TX", program: "Superfund", contaminants: ["Lead", "Arsenic"], lat: 29.76, lng: -95.36, status: "Active", risk: "Medium", funding: 3.8, jobs: 5, ej: true, cleanup_start: "2019-01-01", cleanup_end: null },
    { id: 4, name: "Site D", state: "CA", program: "Brownfields", contaminants: ["Petroleum", "PCBs"], lat: 37.77, lng: -122.42, status: "Completed", risk: "Low", funding: 2.0, jobs: 15, ej: false, cleanup_start: "2021-04-01", cleanup_end: "2023-07-01" },
    { id: 5, name: "Site E", state: "FL", program: "Superfund", contaminants: ["Arsenic"], lat: 25.76, lng: -80.19, status: "Active", risk: "High", funding: 6.0, jobs: 8, ej: true, cleanup_start: "2017-05-01", cleanup_end: null },
    // ... 45 more sites (abridged for brevity)
    { id: 50, name: "Site Z", state: "FL", program: "Brownfields", contaminants: ["Petroleum", "PCBs"], lat: 26.12, lng: -80.14, status: "Completed", risk: "Low", funding: 1.8, jobs: 20, ej: false, cleanup_start: "2020-02-01", cleanup_end: "2022-12-01" }
  ];

  // Initialize map
  const map = L.map('map').setView([39.8283, -98.5795], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // Marker cluster group
  const markers = L.markerClusterGroup();
  let heatmapLayer = null;

  // Update map
  function updateMap(data) {
    markers.clearLayers();
    if (heatmapLayer) map.removeLayer(heatmapLayer);
    data.forEach(site => {
      const marker = L.marker([site.lat, site.lng], {
        icon: L.divIcon({
          className: 'site-marker',
          html: `<div style="background: ${site.program === 'Superfund' ? 'red' : 'green'}; width: 10px; height: 10px; border-radius: 50%;"></div>`
        })
      });
      marker.bindPopup(`
        <b>${site.name}</b><br>
        Program: ${site.program}<br>
        State: ${site.state}<br>
        Contaminants: ${site.contaminants.join(', ')}<br>
        Status: ${site.status}<br>
        Risk Level: ${site.risk}<br>
        Funding: $${site.funding}M<br>
        Jobs Created: ${site.jobs}
      `);
      marker.on('click', () => map.setView([site.lat, site.lng], 10));
      markers.addLayer(marker);
    });
    map.addLayer(markers);
  }

  // Heatmap toggle
  document.getElementById('toggle-heatmap').addEventListener('click', () => {
    if (heatmapLayer) {
      map.removeLayer(heatmapLayer);
      heatmapLayer = null;
      map.addLayer(markers);
    } else {
      map.removeLayer(markers);
      heatmapLayer = L.heatLayer(mockData.map(site => [site.lat, site.lng, site.risk === 'High' ? 1 : 0.5]), {
        radius: 25,
        blur: 15,
        maxZoom: 10
      }).addTo(map);
    }
  });

  // Update KPIs
  function updateKPIs(data) {
    document.getElementById('total-sites').textContent = data.length;
    document.getElementById('active-cleanups').textContent = data.filter(s => s.status === 'Active').length;
    document.getElementById('completed-cleanups').textContent = data.filter(s => s.status === 'Completed').length;
    document.getElementById('high-risk-sites').textContent = data.filter(s => s.risk === 'High').length;
    document.getElementById('grant-funding').textContent = data.reduce((sum, s) => sum + s.funding, 0).toFixed(1);
    document.getElementById('jobs-created').textContent = data.reduce((sum, s) => sum + s.jobs, 0);
  }

  // Contaminant chart
  const contaminantChart = new Chart(document.getElementById('contaminant-chart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Lead', 'PCBs', 'Petroleum', 'Arsenic'],
      datasets: [{ label: 'Contaminant Count', data: [0, 0, 0, 0], backgroundColor: '#60a5fa' }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  // Program chart
  const programChart = new Chart(document.getElementById('program-chart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Superfund', 'Brownfields'],
      datasets: [{ data: [0, 0], backgroundColor: ['#ff5555', '#55ff55'] }]
    },
    options: { responsive: true }
  });

  // Timeline chart
  const timelineChart = new Chart(document.getElementById('timeline-chart').getContext('2d'), {
    type: 'line',
    data: {
      labels: ['2018', '2019', '2020', '2021', '2022', '2023'],
      datasets: [{ label: 'Cleanups Completed', data: [0, 0, 0, 0, 0, 0], borderColor: '#60a5fa', fill: false }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  // Funding chart
  const fundingChart = new Chart(document.getElementById('funding-chart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['EPA Grants', 'Private Investment'],
      datasets: [{ label: 'Funding ($M)', data: [0, 0], backgroundColor: ['#60a5fa', '#93c5fd'] }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });

  // Update charts
  function updateCharts(data) {
    const counts = { Lead: 0, PCBs: 0, Petroleum: 0, Arsenic: 0 };
    data.forEach(site => site.contaminants.forEach(c => counts[c]++));
    contaminantChart.data.datasets[0].data = [counts.Lead, counts.PCBs, counts.Petroleum, counts.Arsenic];
    contaminantChart.update();

    const programs = { Superfund: 0, Brownfields: 0 };
    data.forEach(site => programs[site.program]++);
    programChart.data.datasets[0].data = [programs.Superfund, programs.Brownfields];
    programChart.update();

    const years = { '2018': 0, '2019': 0, '2020': 0, '2021': 0, '2022': 0, '2023': 0 };
    data.forEach(site => {
      if (site.cleanup_end) {
        const year = site.cleanup_end.split('-')[0];
        if (years[year]) years[year]++;
      }
    });
    timelineChart.data.datasets[0].data = Object.values(years);
    timelineChart.update();

    const funding = { grants: data.reduce((sum, s) => sum + s.funding, 0), private: data.reduce((sum, s) => sum + s.funding * 0.5, 0) };
    fundingChart.data.datasets[0].data = [funding.grants, funding.private];
    fundingChart.update();
  }

  // Update table
  function updateTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    data.forEach(site => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${site.name}</td>
        <td>${site.state}</td>
        <td>${site.program}</td>
        <td>${site.contaminants.join(', ')}</td>
        <td>${site.status}</td>
        <td>${site.risk}</td>
        <td><button onclick="map.setView([${site.lat}, ${site.lng}], 10)">View on Map</button></td>
      `;
      tbody.appendChild(row);
    });
  }

  // Search table
  document.getElementById('search-table').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = mockData.filter(s => s.name.toLowerCase().includes(search));
    updateTable(filtered);
  });

  // Sort table
  window.sortTable = (col) => {
    const sorted = [...mockData].sort((a, b) => {
      const keys = ['name', 'state', 'program', 'contaminants', 'status', 'risk'];
      const valueA = col === 3 ? a.contaminants.join(', ') : a[keys[col]];
      const valueB = col === 3 ? b.contaminants.join(', ') : b[keys[col]];
      return valueA.localeCompare(valueB);
    });
    updateTable(sorted);
  };

  // Export CSV
  document.getElementById('export-csv').addEventListener('click', () => {
    const csv = ['Name,State,Program,Contaminants,Status,Risk'];
    mockData.forEach(site => {
      csv.push(`${site.name},${site.state},${site.program},"${site.contaminants.join('; ')}",${site.status},${site.risk}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sites.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  // Event listeners for filters
  document.querySelectorAll('.filters select, .filters input').forEach(el => el.addEventListener('change', filterData));

  // Filter data
  function filterData() {
    const state = document.getElementById('state-filter').value;
    const program = document.getElementById('program-filter').value;
    const contaminant = document.getElementById('contaminant-filter').value;
    const status = document.getElementById('status-filter').value;
    const risk = document.getElementById('risk-filter').value;
    const ej = document.getElementById('ej-filter').checked;
    let filtered = mockData;
    if (state) filtered = filtered.filter(s => s.state === state);
    if (program) filtered = filtered.filter(s => s.program === program);
    if (contaminant) filtered = filtered.filter(s => s.contaminants.includes(contaminant));
    if (status) filtered = filtered.filter(s => s.status === status);
    if (risk) filtered = filtered.filter(s => s.risk === risk);
    if (ej) filtered = filtered.filter(s => s.ej);
    updateMap(filtered);
    updateKPIs(filtered);
    updateCharts(filtered);
    updateTable(filtered);
  }

  // Initial render
  updateMap(mockData);
  updateKPIs(mockData);
  updateCharts(mockData);
  updateTable(mockData);
});
