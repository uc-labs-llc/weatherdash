// js/data-charts.js
import { GLOBAL_API_URL, GLOBAL_API_KEY, GLOBAL_LOCATION } from './api-key.js';
import { solarCalcInstantaneousPower } from './power-calc.js';

// Chart instances
let solarLineChartInstance = null;
let solarBarChartInstance = null;

export class SolarRadiationData {
    constructor() {
        this.solarLocationDisplay = document.getElementById('solar-location-display');
        this.solarCurrentRadiationElement = document.getElementById('current-radiation-display');
        this.solarCurrentTemperatureElement = document.getElementById('current-temperature-display');
        this.solarUpdateStatusElement = document.getElementById('app-status');
        this.solarLastUpdatedElement = document.getElementById('last-updated-time');

        this.solarLocationDisplay.textContent = GLOBAL_LOCATION;
        this.solarFetchWeatherData();
        setInterval(() => this.solarFetchWeatherData(), 10 * 60 * 1000);
    }

    async solarFetchWeatherData() {
        this.solarUpdateStatusElement.textContent = 'Fetching hourly forecast...';
        try {
            const solarUrl = `${GLOBAL_API_URL}${encodeURIComponent(GLOBAL_LOCATION)}/today?key=${GLOBAL_API_KEY}&include=days,hours,current&unitGroup=us&contentType=json`;
            const solarResponse = await fetch(solarUrl);
            if (!solarResponse.ok) {
                throw new Error(`Visual Crossing API error: ${solarResponse.status}`);
            }
            const solarData = await solarResponse.json();
            this.solarUpdateCurrentValue(solarData);
            this.solarRenderCharts(solarData);
            this.solarUpdateLastUpdated();
        } catch (error) {
            console.error('Error fetching solar radiation data:', error);
            this.solarShowErrors(error.message);
        }
    }

    solarUpdateCurrentValue(solarData) {
        if (solarData.currentConditions) {
            if (solarData.currentConditions.solarradiation !== undefined) {
                const solarRadiation = solarData.currentConditions.solarradiation;
                this.solarCurrentRadiationElement.textContent = `${solarRadiation.toFixed(0)} W/m²`;
                document.dispatchEvent(new CustomEvent('solarRadiationUpdated', { detail: { radiation: solarRadiation } }));
            } else {
                this.solarCurrentRadiationElement.textContent = '-- W/m²';
            }
            if (solarData.currentConditions.temp !== undefined) {
                const tempFahrenheit = solarData.currentConditions.temp;
                const tempCelsius = (tempFahrenheit - 32) * 5/9;
                this.solarCurrentTemperatureElement.textContent = `${tempCelsius.toFixed(1)} °C`;
                document.dispatchEvent(new CustomEvent('currentTemperatureUpdated', { detail: { temperature: tempCelsius } }));
            } else {
                this.solarCurrentTemperatureElement.textContent = '-- °C';
            }
            this.solarUpdateStatusElement.textContent = 'Hourly forecast updated.';
        } else {
            this.solarCurrentRadiationElement.textContent = '-- W/m²';
            this.solarCurrentTemperatureElement.textContent = '-- °C';
        }
    }

    solarExtractHourlyData(solarData) {
        const solarHourlyData = [];
        const solarNow = moment();
        const numPanels = parseFloat(document.getElementById('calc-panels').value || 0);
        const panelWatts = parseFloat(document.getElementById('calc-watts').value || 0);
        const lat = parseFloat(document.getElementById('calc-latitude').value || 0);
        const lon = parseFloat(document.getElementById('calc-longitude').value || 0);
        const totalRatedWatts = numPanels * panelWatts;

        if (solarData.days && solarData.days.length > 0 && solarData.days[0].hours) {
            solarData.days[0].hours.forEach(solarHour => {
                const solarTime = moment(solarHour.datetimeEpoch * 1000);
                let powerValue = 0;
                const { power } = solarCalcInstantaneousPower(solarTime.toDate(), lat, lon, totalRatedWatts);
                powerValue = power;
                let hourTemperature = 25;
                if (solarHour.temp !== undefined) {
                    hourTemperature = (solarHour.temp - 32) * 5/9;
                }
                solarHourlyData.push({
                    time: solarTime.format('h A'),
                    value: powerValue,
                    temperature: hourTemperature,
                    isCurrentHour: solarTime.isSame(solarNow, 'hour')
                });
            });
        }
        document.dispatchEvent(new CustomEvent('hourlySolarDataUpdated', { detail: { hourlyData: solarHourlyData } }));
        return solarHourlyData;
    }

    solarRenderCharts(solarData) {
        const solarHourlyData = this.solarExtractHourlyData(solarData);
        const solarLabels = solarHourlyData.map(d => d.time);
        const solarValues = solarHourlyData.map(d => d.value);
        this.solarRenderBarChart(solarLabels, solarValues, solarHourlyData);
        this.solarRenderLineChart(solarLabels, solarValues, solarHourlyData);
    }

    solarRenderLineChart(solarLabels, solarValues, solarHourlyData) {
        const solarPointBackgroundColors = solarHourlyData.map(d => d.isCurrentHour ? '#3498db' : 'rgba(243, 156, 18, 1)');
        const solarPointBorderColors = solarHourlyData.map(d => d.isCurrentHour ? '#ffffff' : '#f39c12');
        const solarPointRadii = solarHourlyData.map(d => d.isCurrentHour ? 6 : 4);
        const solarCtx = document.getElementById('line-chart').getContext('2d');

        if (solarLineChartInstance) {
            solarLineChartInstance.destroy();
        }

        solarLineChartInstance = new Chart(solarCtx, {
            type: 'line',
            data: {
                labels: solarLabels,
                datasets: [{
                    label: 'Calculated Power (W)',
                    data: solarValues,
                    backgroundColor: 'rgba(243, 156, 18, 0.2)',
                    borderColor: '#f39c12',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Power: ${context.parsed.y.toFixed(0)} W`
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
                        title: { display: true, text: 'Power (W)', color: '#ccc' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#bbb', beginAtZero: true }
                    }
                }
            }
        });
    }

    solarRenderBarChart(solarLabels, solarValues, solarHourlyData) {
        const solarBackgroundColors = solarHourlyData.map(d => d.isCurrentHour ? '#3498db' : 'rgba(243, 156, 18, 0.8)');
        const solarBorderColors = solarHourlyData.map(d => d.isCurrentHour ? '#ffffff' : '#f39c12');
        const solarCtx = document.getElementById('bar-chart').getContext('2d');

        if (solarBarChartInstance) {
            solarBarChartInstance.destroy();
        }

        solarBarChartInstance = new Chart(solarCtx, {
            type: 'bar',
            data: {
                labels: solarLabels,
                datasets: [{
                    label: 'Calculated Power (W)',
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
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Power: ${context.parsed.y.toFixed(0)} W`
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
                        title: { display: true, text: 'Power (W)', color: '#ccc' },
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

document.addEventListener('DOMContentLoaded', () => new SolarRadiationData());
