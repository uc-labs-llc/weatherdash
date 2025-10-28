// --- Solar Configuration ---
const SOLAR_VISUAL_CROSSING_API_KEY = 'FDN4TV4276WGXW7UEPR3QV47V'; 
const SOLAR_LOCATION = 'Los Ebanos,Texas';
const SOLAR_VISUAL_CROSSING_URL = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/';

let solarLineChartInstance = null;
let solarBarChartInstance = null;

// --- Solar Radiation Class ---
class SolarRadiationData {
    constructor() {
        this.solarLocationDisplay = document.getElementById('solar-location-display');
        this.solarCurrentRadiationElement = document.getElementById('solar-current-radiation');
        this.solarUpdateStatusElement = document.getElementById('solar-update-status');
        this.solarLastUpdatedElement = document.getElementById('solar-last-updated-time');

        this.solarLocationDisplay.textContent = SOLAR_LOCATION;
        this.solarFetchWeatherData();
        // Refresh data every 10 minutes
        setInterval(() => this.solarFetchWeatherData(), 10 * 60 * 1000); 
    }

    async solarFetchWeatherData() {
        this.solarUpdateStatusElement.textContent = 'Fetching hourly forecast...';
        
        try {
            // Request hourly data for today (include=hours)
            const solarUrl = `${SOLAR_VISUAL_CROSSING_URL}${encodeURIComponent(SOLAR_LOCATION)}/today?key=${SOLAR_VISUAL_CROSSING_API_KEY}&include=days,hours,current&unitGroup=us&contentType=json`;
            
            const solarResponse = await fetch(solarUrl);
            
            if (!solarResponse.ok) {
                throw new Error(`Visual Crossing API error: ${solarResponse.status}`);
            }
            
            const solarData = await solarResponse.json();
            
            this.solarUpdateCurrentValue(solarData);
            this.solarRenderCharts(solarData); // Render both charts
            this.solarUpdateLastUpdated();
            
        } catch (error) {
            console.error('Error fetching solar radiation data:', error);
            this.solarShowErrors(error.message);
        }
    }

    solarUpdateCurrentValue(solarData) {
        if (solarData.currentConditions && solarData.currentConditions.solarradiation !== undefined) {
            const solarRadiation = solarData.currentConditions.solarradiation;
            this.solarCurrentRadiationElement.textContent = `${solarRadiation.toFixed(0)} W/m²`;
            this.solarUpdateStatusElement.textContent = 'Hourly forecast updated.';
        } else {
            this.solarCurrentRadiationElement.textContent = '-- W/m²';
        }
    }

    solarExtractHourlyData(solarData) {
        const solarHourlyData = [];
        const solarNow = moment();
        
        if (solarData.days && solarData.days.length > 0 && solarData.days[0].hours) {
            // Iterate through ALL hours for the full day visualization
            solarData.days[0].hours.forEach(solarHour => {
                const solarTime = moment(solarHour.datetimeEpoch * 1000);
                
                // Solar radiation data is stored in 'solarradiation'
                const solarValue = solarHour.solarradiation !== undefined ? solarHour.solarradiation : 0;
                
                solarHourlyData.push({
                    time: solarTime.format('h A'),
                    value: solarValue,
                    isCurrentHour: solarTime.isSame(solarNow, 'hour')
                });
            });
        }
        return solarHourlyData;
    }
    
    // New method to render both charts
    solarRenderCharts(solarData) {
        const solarHourlyData = this.solarExtractHourlyData(solarData);
        const solarLabels = solarHourlyData.map(d => d.time);
        const solarValues = solarHourlyData.map(d => d.value);

        this.solarRenderBarChart(solarLabels, solarValues, solarHourlyData); // Render Bar Chart first
        this.solarRenderLineChart(solarLabels, solarValues, solarHourlyData); // Render Line Chart second
    }

    // Renders the Line Chart (Progression)
    solarRenderLineChart(solarLabels, solarValues, solarHourlyData) {
        // Highlight the current hour for visual context
        const solarPointBackgroundColors = solarHourlyData.map(d => d.isCurrentHour ? '#3498db' : 'rgba(243, 156, 18, 1)');
        const solarPointBorderColors = solarHourlyData.map(d => d.isCurrentHour ? '#ffffff' : '#f39c12');
        const solarPointRadii = solarHourlyData.map(d => d.isCurrentHour ? 6 : 4);
        
        const solarCtx = document.getElementById('solar-line-chart').getContext('2d');

        if (solarLineChartInstance) {
            solarLineChartInstance.destroy(); // Destroy previous instance
        }

        solarLineChartInstance = new Chart(solarCtx, {
            type: 'line', 
            data: {
                labels: solarLabels,
                datasets: [{
                    label: 'Solar Radiation (W/m²)',
                    data: solarValues,
                    backgroundColor: 'rgba(243, 156, 18, 0.2)', // Light fill under the line
                    borderColor: '#f39c12',
                    borderWidth: 3,
                    fill: true, // Fill the area under the line
                    tension: 0.4, // Make the line curved/smooth
                    pointBackgroundColor: solarPointBackgroundColors,
                    pointBorderColor: solarPointBorderColors,
                    pointRadius: solarPointRadii,
                    pointHoverRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, // Hide redundant legend
                    tooltip: {
                        callbacks: {
                            label: (context) => `Progression: ${context.parsed.y.toFixed(0)} W/m²`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time of Day', color: '#ccc' },
                        // Only show every 4th label to avoid clutter
                        ticks: { 
                            color: '#bbb',
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            callback: function(value, index, values) {
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
    solarRenderBarChart(solarLabels, solarValues, solarHourlyData) {
        const solarBackgroundColors = solarHourlyData.map(d => d.isCurrentHour ? '#3498db' : 'rgba(243, 156, 18, 0.8)');
        const solarBorderColors = solarHourlyData.map(d => d.isCurrentHour ? '#ffffff' : '#f39c12');

        const solarCtx = document.getElementById('solar-bar-chart').getContext('2d');

        if (solarBarChartInstance) {
            solarBarChartInstance.destroy(); // Destroy previous instance
        }

        solarBarChartInstance = new Chart(solarCtx, {
            type: 'bar', 
            data: {
                labels: solarLabels,
                datasets: [{
                    label: 'Solar Radiation (W/m²)',
                    data: solarValues,
                    backgroundColor: solarBackgroundColors,
                    borderColor: solarBorderColors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, // Hide redundant legend
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
                            callback: function(value, index, values) {
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

    solarUpdateLastUpdated() {
        this.solarLastUpdatedElement.textContent = `Last updated: ${moment().format('MMM D, h:mm:ss A')}`;
    }

    solarShowErrors(solarMessage) {
        this.solarCurrentRadiationElement.textContent = 'Error';
        this.solarCurrentRadiationElement.classList.add('solar-error');
        this.solarUpdateStatusElement.textContent = `Error: ${solarMessage}`;
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    new SolarRadiationData();
});
