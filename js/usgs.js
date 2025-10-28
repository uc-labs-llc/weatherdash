// usgs-rio-grande.js - Clean version for Rio Grande temperature monitoring
document.addEventListener('DOMContentLoaded', () => {
  if (window.USGSMonitorInstance) {
    console.warn('USGSMonitor already initialized. Skipping.');
    return;
  }
  window.USGSMonitorInstance = true;

  class USGSMonitor {
    constructor() {
      this.map = null;
      this.isMapOpen = false;
      this.init();
    }

    async init() {
      const quakeMap = document.getElementById('quake-map');
      const quakeMapIcon = document.getElementById('quake-map-icon');
      const quakeMapPopup = document.getElementById('quake-map-popup');
      const quakeMapClose = document.getElementById('quake-map-close');
      if (!quakeMap || !quakeMapIcon || !quakeMapPopup || !quakeMapClose) {
        console.error('Missing map elements:', { quakeMap: !!quakeMap, quakeMapIcon: !!quakeMapIcon, quakeMapPopup: !!quakeMapPopup, quakeMapClose: !!quakeMapClose });
        return;
      }
      this.map = L.map('quake-map', { zoomControl: false }).setView([31, -100], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 10
      }).addTo(this.map);
      quakeMapIcon.addEventListener('click', () => {
        this.isMapOpen = !this.isMapOpen;
        quakeMapPopup.style.display = this.isMapOpen ? 'block' : 'none';
        if (this.isMapOpen) {
          setTimeout(() => this.map.invalidateSize(), 0);
        }
      });
      quakeMapClose.addEventListener('click', () => {
        this.isMapOpen = false;
        quakeMapPopup.style.display = 'none';
      });
      document.addEventListener('click', (e) => {
        if (this.isMapOpen && !quakeMapPopup.contains(e.target) && e.target !== quakeMapIcon) {
          this.isMapOpen = false;
          quakeMapPopup.style.display = 'none';
        }
      });
      await this.loadData();
      setInterval(() => this.loadData(), 900000);
    }

    async loadData() {
      const elements = [
        { id: 'usgs-time', action: el => el.textContent = new Date().toLocaleTimeString() },
        { id: 'quake-count', default: '0 quakes' },
        { id: 'quake-info', default: '--' },
        { id: 'river-status', default: 'Water Quality: Normal' },
        { id: 'river-env', default: 'Rain: -- in/hr | Wind: -- mph' },
        { id: 'river-name-0', default: 'Rio Grande: --°C | -- μS/cm' },
        { id: 'river-bar-0', default: '<div class="river-fill-low" style="width: 0%"></div>' }
      ];

      // Initialize with defaults
      elements.forEach(el => {
        const elem = document.getElementById(el.id);
        if (elem) {
          if (el.action) el.action(elem);
          else if (el.default && 'textContent' in elem) elem.textContent = el.default;
          else if (el.default && 'innerHTML' in elem) elem.innerHTML = el.default;
        }
      });

      try {
        // Earthquakes
        const quakeResponse = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=25&maxlatitude=37&minlongitude=-108&maxlongitude=-93&limit=100&starttime=' + new Date(Date.now() - 3600 * 1000).toISOString());
        if (!quakeResponse.ok) throw new Error('Quake fetch failed');
        const quakeData = await quakeResponse.json();
        
        document.getElementById('quake-count').textContent = `${quakeData.features.length} quakes`;
        
        if (this.map) {
          this.map.eachLayer(layer => {
            if (layer instanceof L.Marker || layer instanceof L.CircleMarker) this.map.removeLayer(layer);
          });
          quakeData.features.slice(0, 10).forEach(quake => {
            const [lon, lat] = quake.geometry.coordinates;
            const mag = quake.properties.mag;
            L.circleMarker([lat, lon], {
              radius: Math.max(3, mag * 2),
              fillColor: mag > 4 ? '#ff7675' : '#00cec9',
              color: '#000',
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            }).addTo(this.map).bindPopup(`M${mag.toFixed(1)} - ${quake.properties.place}`);
          });
          if (this.isMapOpen) {
            setTimeout(() => this.map.invalidateSize(), 0);
          }
        }

        const quakeInfo = document.getElementById('quake-info');
        if (quakeData.features.length > 0) {
          const latest = quakeData.features[0];
          let intensity = 'No felt reports';
          try {
            const dyfiResponse = await fetch(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${latest.id}.geojson`);
            if (dyfiResponse.ok) {
              const dyfiData = await dyfiResponse.json();
              const cdi = dyfiData.properties.products?.dyfi?.[0]?.properties?.maxmmi;
              if (cdi) {
                const intensities = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
                intensity = `Intensity ${intensities[Math.round(cdi) - 1] || 'I'}`;
              }
            }
          } catch (e) {
            console.warn('DYFI fetch failed:', e);
          }
          quakeInfo.textContent = `M${latest.properties.mag.toFixed(1)} - ${latest.properties.place} | ${intensity}`;
        } else {
          quakeInfo.textContent = 'No recent quakes';
        }

        // Rio Grande Water Quality - Using working station 08467680
const sites = ['08467680'];  // Use Creede, CO instead
const riverNames = ['Rio Grande nr Mission, TX'];
	      const waterPromises = sites.map(site => fetch(`https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site}&parameterCd=00010,00095&siteStatus=all`));
        const waterResponses = await Promise.all(waterPromises);
        
        const conductances = [], temps = [];
        for (let i = 0; i < waterResponses.length; i++) {
          if (!waterResponses[i].ok) throw new Error('Water fetch failed');
          const data = await waterResponses[i].json();
          const ts = data.value.timeSeries;
          
          // Extract temperature and conductance
          const conductance = ts.find(t => t.variable.variableCode[0].value === '00095')?.values[0]?.value[0]?.value;
          const temp = ts.find(t => t.variable.variableCode[0].value === '00010')?.values[0]?.value[0]?.value;
          
          conductances.push(conductance ? parseFloat(conductance) : null);
          temps.push(temp ? parseFloat(temp) : null);
        }

        // Update display
        document.getElementById('river-status').textContent = 'Water Quality: Normal';
        
        conductances.forEach((conductance, i) => {
          const conductanceDisplay = conductance !== null ? `${conductance.toFixed(0)} μS/cm` : '-- μS/cm';
          const tempDisplay = temps[i] !== null ? `${temps[i].toFixed(1)}°C` : '--°C';
          
          document.getElementById(`river-name-${i}`).textContent = `${riverNames[i]}: ${tempDisplay} | ${conductanceDisplay}`;
          document.getElementById(`river-bar-${i}`).innerHTML = '<div class="river-fill-low" style="width: 0%"></div>';
        });

        // Weather
        let rain = 0, wind = '0 mph';
        try {
          const nwsPoint = await fetch('https://api.weather.gov/points/25.90,-97.49');
          if (!nwsPoint.ok) throw new Error('NWS point fetch failed');
          const pointData = await nwsPoint.json();
          const hourlyUrl = pointData.properties.forecastHourly;
          const nwsHourly = await fetch(hourlyUrl);
          if (!nwsHourly.ok) throw new Error('NWS hourly fetch failed');
          const hourlyData = await nwsHourly.json();
          rain = hourlyData.properties.periods[0].probabilityOfPrecipitation.value || 0;
          wind = hourlyData.properties.periods[0].windSpeed || '0 mph';
        } catch (e) {
          console.warn('NWS fetch failed:', e);
        }
        document.getElementById('river-env').textContent = `Rain: ${rain / 100} in/hr | Wind: ${wind}`;

      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }

  new USGSMonitor();
});
