// usgs-flood-flow.js - Flood and flow monitoring for Rio Grande
document.addEventListener('DOMContentLoaded', () => {
  class USGSFloodMonitor {
    constructor() {
      this.previousLevels = [null];
      this.init();
    }

    async init() {
      await this.loadFloodData();
      setInterval(() => this.loadFloodData(), 60000);
    }

    async loadFloodData() {
      try {
        // Flood & Flow data - Using the working Rio Grande station
const sites = ['08374550', '08458995', '08252500'];  // Add Colorado station
const floodStages = [10, 14, 8];                     // Add flood stage for CO (estimate)
const riverNames = ['Rio Grande nr Castolon, TX', 'Zacate Ck at Laredo, TX', 'Costilla Creek Above Costilla Dam, NM'];
	const waterPromises = sites.map(site => fetch(`https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${site}&parameterCd=00065,00060&siteStatus=all`));
        const waterResponses = await Promise.all(waterPromises);
        
        const levels = [], flows = [];
        for (let i = 0; i < waterResponses.length; i++) {
          if (!waterResponses[i].ok) throw new Error('Water fetch failed');
          const data = await waterResponses[i].json();
          const ts = data.value.timeSeries;
          
          const level = ts.find(t => t.variable.variableCode[0].value === '00065')?.values[0]?.value[0]?.value;
          const flow = ts.find(t => t.variable.variableCode[0].value === '00060')?.values[0]?.value[0]?.value;
          
          levels.push(level ? parseFloat(level) : 0);
          flows.push(flow ? parseFloat(flow) : 0);
        }

        // Update flood/flow display
        levels.forEach((level, i) => {
          const flood = floodStages[i];
          const perc = Math.min(100, (level / flood) * 100);
          let riskClass = 'river-fill-low';
          if (perc >= 75) riskClass = 'river-fill-high';
          else if (perc >= 50) riskClass = 'river-fill-medium';
          
          let trend = '';
          if (this.previousLevels[i] !== null) {
            trend = level > this.previousLevels[i] ? '↑' : level < this.previousLevels[i] ? '↓' : '→';
          }
          this.previousLevels[i] = level;

          this.updateDisplay(i, riverNames[i], level, flood, flows[i], trend, riskClass, perc);
        });

      } catch (error) {
        console.error('Error loading flood data:', error);
      }
    }

    updateDisplay(index, riverName, level, flood, flow, trend, riskClass, perc) {
      const containerId = `flood-flow-${index}`;
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'river-data';
        
        const nameElem = document.createElement('div');
        nameElem.id = `flood-name-${index}`;
        nameElem.className = 'river-name';
        
        const barElem = document.createElement('div');
        barElem.id = `flood-bar-${index}`;
        barElem.className = 'river-bar';
        
        container.appendChild(nameElem);
        container.appendChild(barElem);
        
        // Insert after the existing river data
        const existingRiver = document.getElementById('river-bar-0').parentElement;
        existingRiver.parentNode.insertBefore(container, existingRiver.nextSibling);
      }

      // Update the content
      document.getElementById(`flood-name-${index}`).textContent = 
        `${riverName}: ${level.toFixed(1)} ft / ${flood} ft | ${flow.toFixed(0)} cfs ${trend}`;
      
      document.getElementById(`flood-bar-${index}`).innerHTML = 
        `<div class="${riskClass}" style="width: ${perc}%"></div>`;
    }
  }

  new USGSFloodMonitor();
});
