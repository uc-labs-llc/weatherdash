// js/true-power-calc.js
import { GLOBAL_API_URL, GLOBAL_API_KEY, GLOBAL_LOCATION } from './api-key.js';

export class TruePowerCalculator {
    constructor() {
        this.truePowerChartInstance = null;
        this.currentSolarRadiation = 0;
        this.currentTemperature = 25;
        this.hourlyData = [];
        this.initializeEventListeners();
        this.fetchTruePowerData();
        setInterval(() => this.fetchTruePowerData(), 10 * 60 * 1000);
        console.log("TruePowerCalculator initialized");
        this.debugInputs();
    }

    initializeEventListeners() {
        document.getElementById('panelSpecsForm').addEventListener('input', () => {
            this.updateTruePowerDisplay();
            this.updateTruePowerChart();
        });
        document.getElementById('solarCalcForm').addEventListener('input', () => {
            this.updateTruePowerDisplay();
            this.updateTruePowerChart();
        });
        document.getElementById('use-current-temp').addEventListener('click', () => {
            document.getElementById('ambient-temp').value = this.currentTemperature.toFixed(1);
            this.updateTruePowerDisplay();
            this.updateTruePowerChart();
        });
        document.addEventListener('solarRadiationUpdated', (event) => {
            console.log("Solar radiation updated:", event.detail.radiation);
            this.currentSolarRadiation = event.detail.radiation;
            this.updateTruePowerDisplay();
        });
        document.addEventListener('currentTemperatureUpdated', (event) => {
            console.log("Temperature updated:", event.detail.temperature);
            this.currentTemperature = event.detail.temperature;
            this.updateTruePowerDisplay();
        });
    }

    async fetchTruePowerData() {
        try {
            const lat = document.getElementById('calc-latitude').value || '26.2434';
            const lon = document.getElementById('calc-longitude').value || '-98.5617';
            const location = GLOBAL_LOCATION;
            const solarUrl = `${GLOBAL_API_URL}${encodeURIComponent(location)}/today?key=${GLOBAL_API_KEY}&include=days,hours,current&unitGroup=us&contentType=json`;
            const solarResponse = await fetch(solarUrl);
            if (!solarResponse.ok) {
                throw new Error(`Weather API error: ${solarResponse.status}`);
            }
            const solarData = await solarResponse.json();
            this.processTruePowerData(solarData);
        } catch (error) {
            console.error('Error fetching true power data:', error);
        }
    }

    processTruePowerData(solarData) {
        const solarNow = moment();
        this.hourlyData = [];
        if (solarData.days && solarData.days.length > 0 && solarData.days[0].hours) {
            solarData.days[0].hours.forEach(solarHour => {
                const solarTime = moment(solarHour.datetimeEpoch * 1000);
                let radiationValue = 0;
                if (solarHour.solarradiation !== undefined) {
                    radiationValue = solarHour.solarradiation;
                }
                let hourTemperature = 25;
                if (solarHour.temp !== undefined) {
                    hourTemperature = (solarHour.temp - 32) * 5/9;
                }
                this.hourlyData.push({
                    time: solarTime.format('h A'),
                    radiation: radiationValue,
                    temperature: hourTemperature,
                    isCurrentHour: solarTime.isSame(solarNow, 'hour')
                });
            });
        }
        this.updateTruePowerDisplay();
        this.updateTruePowerChart();
    }

    debugInputs() {
        const panelCount = parseInt(document.getElementById('calc-panels').value) || 10;
        const panelWatts = parseInt(document.getElementById('calc-watts').value) || 400;
        const efficiency = parseFloat(document.getElementById('panel-efficiency').value) || 20.5;
        const systemLosses = parseFloat(document.getElementById('system-losses').value) || 14;
        const tempCoeff = parseFloat(document.getElementById('panel-temp-coeff').value) || 0.35;
        const ambientTemp = parseFloat(document.getElementById('ambient-temp').value) || 25;
        const panelArea = parseFloat(document.getElementById('panel-area').value) || 1.8;

        console.log("Current inputs:");
        console.log("- Panels:", panelCount, "×", panelWatts, "W =", panelCount * panelWatts, "W system");
        console.log("- Efficiency:", efficiency, "%");
        console.log("- System Losses:", systemLosses, "%");
        console.log("- Temp Coefficient:", tempCoeff, "%/°C");
        console.log("- Ambient Temp:", ambientTemp, "°C");
        console.log("- Panel Area:", panelArea, "m² per panel");
        console.log("- Current Solar Radiation:", this.currentSolarRadiation, "W/m²");
    }

    calculateTruePower(solarRadiation, temperature = null) {
        const panelCount = parseInt(document.getElementById('calc-panels').value) || 10;
        const panelWatts = parseInt(document.getElementById('calc-watts').value) || 400;
        const efficiency = parseFloat(document.getElementById('panel-efficiency').value) || 20.5;
        const systemLosses = parseFloat(document.getElementById('system-losses').value) || 14;
        const tempCoeff = parseFloat(document.getElementById('panel-temp-coeff').value) || 0.35;
        const ambientTemp = parseFloat(document.getElementById('ambient-temp').value) || 25;
        const panelArea = parseFloat(document.getElementById('panel-area').value) || 1.8;
        const useTemp = temperature !== null ? temperature : ambientTemp;

        console.log("=== TRUE POWER CALCULATION ===");
        console.log("Inputs:");
        console.log("  Solar Radiation:", solarRadiation, "W/m²");
        console.log("  Panel Count:", panelCount);
        console.log("  Panel Watts:", panelWatts, "W each");
        console.log("  Total System Capacity:", panelCount * panelWatts, "W");
        console.log("  Panel Area:", panelArea, "m² each");
        console.log("  Total Panel Area:", panelCount * panelArea, "m²");
        console.log("  Efficiency:", efficiency, "%");
        console.log("  System Losses:", systemLosses, "%");
        console.log("  Temp Coefficient:", tempCoeff, "%/°C");
        console.log("  Temperature:", useTemp, "°C");

        const totalArea = panelCount * panelArea;
        const stcRadiation = 1000;
        const powerRatio = solarRadiation / stcRadiation;
        const powerFromSTC = panelWatts * panelCount * powerRatio;
        console.log("Power from STC method:", powerFromSTC, "W");

        let rawPower = powerFromSTC;
        console.log("Using STC method - Raw power:", rawPower, "W");

        const panelOperatingTemp = useTemp + 25;
        const tempLoss = (tempCoeff / 100) * (panelOperatingTemp - 25);
        const tempAdjustedPower = powerFromSTC * Math.max(0, (1 - tempLoss));
        console.log("Temperature-adjusted power:", tempAdjustedPower, "W");

        const systemAdjustedPower = tempAdjustedPower * (1 - (systemLosses / 100));
        console.log("System-adjusted power:", systemAdjustedPower, "W");

        const systemCapacity = panelCount * panelWatts;
        const finalPower = Math.max(0, Math.round(Math.min(systemAdjustedPower, systemCapacity)));
        console.log("Final true power (capped at system capacity):", finalPower, "W");
        return finalPower;
    }

    updateTruePowerDisplay() {
        const truePower = this.calculateTruePower(this.currentSolarRadiation);
        let displayText = truePower + " W";
        if (truePower >= 1000) {
            displayText = (truePower / 1000).toFixed(1) + " kW";
        }
        document.getElementById('true-power-output').textContent = displayText;
        document.dispatchEvent(new CustomEvent('truePowerUpdated', { detail: { power: truePower } }));
    }

    updateTruePowerChart() {
        if (this.hourlyData.length === 0) return;
        const labels = this.hourlyData.map(d => d.time);
        const truePowerValues = this.hourlyData.map(d => this.calculateTruePower(d.radiation, d.temperature));
        const maxDataValue = Math.max(...truePowerValues);
        const yAxisMax = Math.ceil(maxDataValue * 1.1);

        if (this.truePowerChartInstance) {
            this.truePowerChartInstance.destroy();
        }
        this.truePowerChartInstance = new Chart(document.getElementById('true-power-chart').getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'True Power Output',
                    data: truePowerValues,
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: '#2ecc71',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.hourlyData.map(d => d.isCurrentHour ? '#3498db' : 'rgba(46, 204, 113, 0.8)'),
                    pointBorderColor: this.hourlyData.map(d => d.isCurrentHour ? '#ffffff' : '#2ecc71'),
                    pointRadius: this.hourlyData.map(d => d.isCurrentHour ? 6 : 4),
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const power = context.parsed.y;
                                return `True Power: ${power >= 1000 ? (power/1000).toFixed(1) + ' kW' : power.toFixed(0) + ' W'}`;
                            }
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
                        title: { display: true, text: 'Power Output', color: '#ccc' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        min: 0,
                        max: yAxisMax,
                        ticks: {
                            color: '#bbb',
                            beginAtZero: true,
                            callback: function(value) {
                                return value >= 1000 ? (value/1000).toFixed(1) + 'kW' : value + 'W';
                            }
                        }
                    }
                }
            }
        });
    }
}

export class BatteryChargerCalculator {
    constructor() {
        this.initializeEventListeners();
        this.updateBatteryCharging();
    }

    initializeEventListeners() {
        document.getElementById('batteryChargerForm').addEventListener('input', () => {
            this.updateBatteryCharging();
        });
        document.getElementById('battery-voltage').addEventListener('change', () => {
            this.updateBatteryCharging();
        });
        document.addEventListener('truePowerUpdated', () => {
            this.updateBatteryCharging();
        });
    }

    updateBatteryCharging() {
        const truePowerText = document.getElementById('true-power-output').textContent;
        let truePower = 0;
        if (truePowerText.includes('kW')) {
            truePower = parseFloat(truePowerText) * 1000;
        } else {
            truePower = parseFloat(truePowerText) || 0;
        }
        const batteryCapacity = parseFloat(document.getElementById('battery-capacity').value) || 10;
        const batteryVoltage = parseFloat(document.getElementById('battery-voltage').value) || 48;
        const currentSOC = parseFloat(document.getElementById('current-soc').value) || 20;
        const chargeEfficiency = parseFloat(document.getElementById('charge-efficiency').value) || 85;

        let displayPower = truePower + " W";
        if (truePower >= 1000) {
            displayPower = (truePower / 1000).toFixed(1) + " kW";
        }
        document.getElementById('available-solar-power').textContent = displayPower;

        if (truePower > 0) {
            const usablePower = truePower * (chargeEfficiency / 100);
            const remainingCapacity = batteryCapacity * (100 - currentSOC) / 100;
            const remainingWattHours = remainingCapacity * 1000;
            const hoursToFull = remainingWattHours / usablePower;
            const kWhPerHour = usablePower / 1000;
            const chargeRatePercent = Math.min(100, (1 / hoursToFull) * 100);

            document.getElementById('time-to-full').textContent = this.formatTime(hoursToFull);
            document.getElementById('kwh-per-hour').textContent = kWhPerHour.toFixed(3) + " kWh";
            const progressBar = document.getElementById('charge-progress');
            const percentageDisplay = document.getElementById('charge-percentage');
            progressBar.style.width = chargeRatePercent + '%';
            percentageDisplay.textContent = chargeRatePercent.toFixed(1) + '%';
            if (chargeRatePercent < 10) {
                progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #e67e22)';
            } else if (chargeRatePercent < 30) {
                progressBar.style.background = 'linear-gradient(90deg, #e67e22, #f39c12)';
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #f39c12, #2ecc71)';
            }

            console.log("Battery Charging Update:");
            console.log("- True Power:", truePower, "W");
            console.log("- Usable Power:", usablePower, "W");
            console.log("- Hours to Full:", hoursToFull);
            console.log("- Charge Rate:", chargeRatePercent, "% per hour");
        } else {
            document.getElementById('time-to-full').textContent = "∞ (No Power)";
            document.getElementById('kwh-per-hour').textContent = "0.000 kWh";
            document.getElementById('charge-progress').style.width = '0%';
            document.getElementById('charge-percentage').textContent = "0%";
            document.getElementById('charge-progress').style.background = '#e74c3c';
        }
    }

    formatTime(hours) {
        if (hours === Infinity || hours > 8760) {
            return "∞ (Never)";
        }
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        if (wholeHours >= 168) {
            const weeks = Math.floor(wholeHours / 168);
            const days = Math.floor((wholeHours % 168) / 24);
            return `${weeks}w ${days}d`;
        } else if (wholeHours >= 24) {
            const days = Math.floor(wholeHours / 24);
            const remainingHours = wholeHours % 24;
            return `${days}d ${remainingHours}h`;
        } else if (wholeHours >= 1) {
            return `${wholeHours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return "< 1m";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TruePowerCalculator();
    new BatteryChargerCalculator();
});
