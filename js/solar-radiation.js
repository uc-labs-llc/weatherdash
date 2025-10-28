// --- Configuration ---
const VISUAL_CROSSING_API_KEY = 'FDN4TV4276WGXW7UEPR3QV47V'; 
const VISUAL_CROSSING_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';

let solarLineChartInstance = null;
let solarBarChartInstance = null;

// --- Solar Radiation Class ---
class SolarRadiationData {
    constructor() {
        // Use prefixed IDs to avoid conflicts
        this.locationDisplay = document.getElementById('solar-rad-location-display');
        this.currentSolarRadiationElement = document.getElementById('solar-rad-current-value');
        this.updateStatusElement = document.getElementById('solar-rad-update-status');
        this.lastUpdatedElement = document.getElementById('solar-rad-last-updated-time');

        // Check if required libraries are loaded
        if (typeof Chart === 'undefined' || typeof moment === 'undefined') {
             this.showErrors("Required libraries (Chart.js/Moment.js) not loaded.");
             return;
        }

        if (this.locationDisplay) this.locationDisplay.textContent = LOCATION;
        this.fetchWeatherData();
        // Refresh data every 10 minutes
        setInterval(() => this.fetchWeatherData(), 10 * 60 * 1000); 
    }

    async fetchWeatherData() {
        if (this.updateStatusElement) this.updateStatusElement.textContent = 'Fetching hourly forecast...';
        
        try {
            // Request hourly data for today (include=hours)
            const url = `${VISUAL_CROSSING_URL}${encodeURIComponent(LOCATION)}/today?key=${VISUAL_CROSSING_API_KEY}&include=days,hours,current&unitGroup=us&contentType=json`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Visual Crossing API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.updateCurrentValue(data);
            this.renderCharts(data); // Render both charts
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error fetching solar radiation data:', error);
            this.showErrors(error.message);
        }
    }

    updateCurrentValue(data) {
        if (!this.currentSolarRadiationElement) return;

        if (data.currentConditions && data.currentConditions.solarradiation !== undefined) {
            const radiation = data.currentConditions.solarradiation;
            this.currentSolarRadiationElement.textContent = `${radiation.toFixed(0)} W/m²`;
            if (this.updateStatusElement) this.updateStatusElement.textContent = 'Hourly forecast updated.';
        } else {
            this.currentSolarRadiationElement.textContent = '-- W/m²';
        }
    }

    extractHourlyData(data) {
        const hourlyData = [];
        const now = moment();
        
        if (data.days && data.days.length > 0 && data.days[0].hours) {
            // Iterate through ALL hours for the full day visualization
            data.days[0].hours.forEach(hour => {
                // Use data timezone for accurate time conversion
                const time = moment(hour.datetimeEpoch * 1000).tz(data.timezone); 
                
                // Solar radiation data is stored in 'solarradiation'
                const value = hour.solarradiation !== undefined ? hour.solarradiation : 0;
                
                hourlyData.push({
                    time: time.format('h A'),
                    value: value,
                    isCurrentHour: time.isSame(now, 'hour')
                });
            });
        }
        return hourlyData;
    }
    
    // Method to render both charts
    renderCharts(data) {
        const hourlyData = this.extractHourlyData(data);
        const labels = hourlyData.map(d => d.time);
        const values = hourlyData.map(d => d.value);

        // Render Bar Chart first (Top)
        this.renderBarChart(labels, values, hourlyData); 
        // Render Line Chart second (Bottom)
        this.renderLineChart(labels, values, hourlyData); 
    }

    // Renders the Line Chart (Progression)
    renderLineChart(labels, values, hourlyData) {
        const ctx = document.getElementById('solar-rad-line-chart')?.getContext('2d');
        if (!ctx) return;
        
        // Highlight the current hour for visual context
        const pointBackgroundColors = hourlyData.map(d => d.isCurrentHour ? '#3498db' : 'rgba(243, 156, 18, 1)');
        const pointBorderColors = hourlyData.map(d => d.isCurrentHour ? '#ffffff' : '#f39c12');
        const pointRadii = hourlyData.map(d => d.isCurrentHour ? 6 : 4);
        
        if (solarLineChartInstance) {
            solarLineChartInstance.destroy(); // Destroy previous instance
        }

        solarLineChartInstance = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: labels,
                datasets: [{
                    label: 'Solar Radiation (W/m²)',
                    data: values,
                    backgroundColor: 'rgba(243, 156, 18, 0.2)', 
                    borderColor: '#f39c12',
                    borderWidth: 3,
                    fill: true, 
                    tension: 0.4, 
                    pointBackgroundColor: pointBackgroundColors,
                    pointBorderColor: pointBorderColors,
                    pointRadius: pointRadii,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, 
                    tooltip: {
                        callbacks: {
                            label: (context) => `Progression: ${context.parsed.y.toFixed(0)} W/m²`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time of Day', color: '#ccc' },
                        ticks: { 
                            color: '#bbb',
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            callback: function(value, index) {
                                return index % 4 === 0 ? this.getLabelForValue(value) : '';
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        title: { display: true, text: 'Radiation (W/m²)', color: '#ccc' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#bbb', beginAtZero: true }
                    }
                }
            }
        });
    }
    
    // Renders the Bar Chart (Magnitude)
    renderBarChart(labels, values, hourlyData) {
        const ctx = document.getElementById('solar-rad-bar-chart')?.getContext('2d');
        if (!ctx) return;

        const backgroundColors = hourlyData.map(d => d.isCurrentHour ? '#3498db' : 'rgba(243, 156, 18, 0.8)');
        const borderColors = hourlyData.map(d => d.isCurrentHour ? '#ffffff' : '#f39c12');

        if (solarBarChartInstance) {
            solarBarChartInstance.destroy(); // Destroy previous instance
        }

        solarBarChartInstance = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: labels,
                datasets: [{
                    label: 'Solar Radiation (W/m²)',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, 
                    tooltip: {
                        callbacks: {
                            label: (context) => `Hourly: ${context.parsed.y.toFixed(0)} W/m²`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time of Day', color: '#ccc' },
                        ticks: { 
                            color: '#bbb',
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            callback: function(value, index) {
                                return index % 4 === 0 ? this.getLabelForValue(value) : '';
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        title: { display: true, text: 'Radiation (W/m²)', color: '#ccc' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#bbb', beginAtZero: true }
                    }
                }
            }
        });
    }

    updateLastUpdated() {
        if (this.lastUpdatedElement) {
            this.lastUpdatedElement.textContent = `Last updated: ${moment().format('MMM D, h:mm:ss A')}`;
        }
    }

    showErrors(message) {
        if (this.currentSolarRadiationElement) {
            this.currentSolarRadiationElement.textContent = 'Error';
            this.currentSolarRadiationElement.classList.add('text-red-500');
        }
        if (this.updateStatusElement) {
            this.updateStatusElement.textContent = `Error: ${message}`;
        }
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if the main container exists to prevent errors on non-Solar-Rad pages
    if (document.getElementById('solar-rad-app-container')) {
        new SolarRadiationData();
    }
});

