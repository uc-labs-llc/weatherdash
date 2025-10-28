import { 
    OWM_API_KEY as OWM_API_KEY, 
    OWM_LAT as lat, 
    OWM_LON as lon 
} from './api-key.js'; // Ensure the path is correct!

document.addEventListener('DOMContentLoaded', function() {

    function calculatePM25AQI(pm25) {
        if (pm25 <= 12.0) return interpolate(pm25, 0, 12.0, 0, 50);
        if (pm25 <= 35.4) return interpolate(pm25, 12.1, 35.4, 51, 100);
        if (pm25 <= 55.4) return interpolate(pm25, 35.5, 55.4, 101, 150);
        if (pm25 <= 150.4) return interpolate(pm25, 55.5, 150.4, 151, 200);
        if (pm25 <= 250.4) return interpolate(pm25, 150.5, 250.4, 201, 300);
        if (pm25 <= 500.4) return interpolate(pm25, 250.5, 500.4, 301, 500);
        return 500;
    }

    function calculatePM10AQI(pm10) {
        if (pm10 <= 54) return interpolate(pm10, 0, 54, 0, 50);
        if (pm10 <= 154) return interpolate(pm10, 55, 154, 51, 100);
        if (pm10 <= 254) return interpolate(pm10, 155, 254, 101, 150);
        if (pm10 <= 354) return interpolate(pm10, 255, 354, 151, 200);
        if (pm10 <= 424) return interpolate(pm10, 355, 424, 201, 300);
        if (pm10 <= 604) return interpolate(pm10, 425, 604, 301, 500);
        return 500;
    }

    function calculateO3AQI(o3) {  // O3 in μg/m³; approximate for 8-hr ppm (EPA uses ppm)
        const o3Ppm = o3 / 1960;  // Rough conversion at std temp/pressure
        if (o3Ppm <= 0.054) return 0;
        if (o3Ppm <= 0.070) return interpolate(o3Ppm, 0.055, 0.070, 51, 100);
        if (o3Ppm <= 0.085) return interpolate(o3Ppm, 0.071, 0.085, 101, 150);
        if (o3Ppm <= 0.105) return interpolate(o3Ppm, 0.086, 0.105, 151, 200);
        if (o3Ppm <= 0.200) return interpolate(o3Ppm, 0.106, 0.200, 201, 300);
        return 301;
    }

    function calculateNO2AQI(no2) {  // NO2 in μg/m³; convert to ppb
        const no2Ppb = no2 / 1.88;
        if (no2Ppb <= 53) return interpolate(no2Ppb, 0, 53, 0, 50);
        if (no2Ppb <= 100) return interpolate(no2Ppb, 54, 100, 51, 100);
        if (no2Ppb <= 360) return interpolate(no2Ppb, 101, 360, 101, 150);
        if (no2Ppb <= 649) return interpolate(no2Ppb, 361, 649, 151, 200);
        if (no2Ppb <= 1249) return interpolate(no2Ppb, 650, 1249, 201, 300);
        if (no2Ppb <= 2049) return interpolate(no2Ppb, 1250, 2049, 301, 500);
        return 500;
    }

    function calculateSO2AQI(so2) {  // SO2 in μg/m³; convert to ppb
        const so2Ppb = so2 / 2.62;
        if (so2Ppb <= 35) return interpolate(so2Ppb, 0, 35, 0, 50);
        if (so2Ppb <= 75) return interpolate(so2Ppb, 36, 75, 51, 100);
        if (so2Ppb <= 185) return interpolate(so2Ppb, 76, 185, 101, 150);
        if (so2Ppb <= 304) return interpolate(so2Ppb, 186, 304, 151, 200);
        if (so2Ppb <= 604) return interpolate(so2Ppb, 305, 604, 201, 300);
        if (so2Ppb <= 1004) return interpolate(so2Ppb, 605, 1004, 301, 500);
        return 500;
    }

    function calculateCOAQI(co) {  // CO in μg/m³; convert to ppm
        const coPpm = co / 1145;
        if (coPpm <= 4.4) return interpolate(coPpm, 0, 4.4, 0, 50);
        if (coPpm <= 9.4) return interpolate(coPpm, 4.5, 9.4, 51, 100);
        if (coPpm <= 12.4) return interpolate(coPpm, 9.5, 12.4, 101, 150);
        if (coPpm <= 15.4) return interpolate(coPpm, 12.5, 15.4, 151, 200);
        if (coPpm <= 30.4) return interpolate(coPpm, 15.5, 30.4, 201, 300);
        if (coPpm <= 50.4) return interpolate(coPpm, 30.5, 50.4, 301, 500);
        return 500;
    }

    function interpolate(value, lowC, highC, lowAQI, highAQI) {
        return Math.round(((highAQI - lowAQI) / (highC - lowC)) * (value - lowC) + lowAQI);
    }

    function getAQICategory(aqi) {
        if (aqi <= 50) return 'Good';
        if (aqi <= 100) return 'Moderate';
        if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
        if (aqi <= 200) return 'Unhealthy';
        if (aqi <= 300) return 'Very Unhealthy';
        if (aqi <= 500) return 'Hazardous';
        return 'Hazardous';
    }

    function getAQIColorClass(aqi) {
        if (aqi <= 50) return 'aqi-good';
        if (aqi <= 100) return 'aqi-moderate';
        if (aqi <= 150) return 'aqi-unhealthy-sensitive';
        if (aqi <= 200) return 'aqi-unhealthy';
        if (aqi <= 300) return 'aqi-very-unhealthy';
        return 'aqi-hazardous';
    }

    function getHealthMessage(aqi) {
        if (aqi <= 50) return 'Air quality is good. Enjoy outdoor activities!';
        if (aqi <= 100) return 'Air quality is acceptable. Sensitive groups may experience minor effects.';
        if (aqi <= 150) return 'Air quality is unhealthy for sensitive groups. Reduce prolonged outdoor exertion.';
        if (aqi <= 200) return 'Air quality is unhealthy. Limit outdoor activities, especially for sensitive groups.';
        if (aqi <= 300) return 'Air quality is very unhealthy. Avoid outdoor activities.';
        if (aqi <= 500) return 'Air quality is hazardous. Stay indoors and avoid physical exertion.';
        return 'Air quality is hazardous. Stay indoors and avoid physical exertion.';
    }

    // Current Air Pollution Fetch
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Current Air Pollution Data:', data);
            const components = data.list[0].components;
            const pm25Aqi = calculatePM25AQI(components.pm2_5);
            const pm10Aqi = calculatePM10AQI(components.pm10);
            const o3Aqi = calculateO3AQI(components.o3);
            const no2Aqi = calculateNO2AQI(components.no2);
            const so2Aqi = calculateSO2AQI(components.so2);
            const coAqi = calculateCOAQI(components.co);
            const aqiValue = Math.max(pm25Aqi, pm10Aqi, o3Aqi, no2Aqi, so2Aqi, coAqi);

            console.log('Sub-indices:', { pm25Aqi, pm10Aqi, o3Aqi, no2Aqi, so2Aqi, coAqi, finalAqi: aqiValue });

            const elements = {
                'aqi-value': document.getElementById('aqi-value'),
                'aqi-category': document.getElementById('aqi-category'),
                'pm25': document.getElementById('pm25'),
                'pm10': document.getElementById('pm10'),
                'o3': document.getElementById('o3'),
                'no2': document.getElementById('no2'),
                'so2': document.getElementById('so2'),
                'co': document.getElementById('co'),
                'health-message': document.getElementById('health-message')
            };

            // Apply AQI color classes
            const aqiColorClass = getAQIColorClass(aqiValue);
            const aqiValueElement = elements['aqi-value'];
            const aqiCategoryElement = elements['aqi-category'];

            // Remove any existing AQI color classes and add the current one
            aqiValueElement.className = 'aqi-value';
            aqiCategoryElement.className = 'aqi-category';
            aqiValueElement.classList.add(aqiColorClass);
            aqiCategoryElement.classList.add(aqiColorClass);

            for (const [id, element] of Object.entries(elements)) {
                if (!element) {
                    console.error(`Element with ID '${id}' not found in the DOM.`);
                    continue;
                }
                switch (id) {
                    case 'aqi-value':
                        element.textContent = aqiValue;
                        break;
                    case 'aqi-category':
                        element.textContent = getAQICategory(aqiValue);
                        break;
                    case 'pm25':
                        element.textContent = components.pm2_5.toFixed(1);
                        break;
                    case 'pm10':
                        element.textContent = components.pm10.toFixed(1);
                        break;
                    case 'o3':
                        element.textContent = components.o3.toFixed(1);
                        break;
                    case 'no2':
                        element.textContent = components.no2.toFixed(1);
                        break;
                    case 'so2':
                        element.textContent = components.so2.toFixed(1);
                        break;
                    case 'co':
                        element.textContent = components.co.toFixed(1);
                        break;
                    case 'health-message':
                        element.textContent = getHealthMessage(aqiValue);
                        break;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching current air pollution:', error);
            const healthMessage = document.getElementById('health-message');
            if (healthMessage) {
                healthMessage.textContent = 'Air quality data not available';
            }
        });

    // Air Pollution Forecast Fetch for Trends
    fetch(`https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${OWM_API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Air Pollution Forecast Data:', data);

            if (!data.list || data.list.length === 0) {
                console.warn('No forecast data available, using fallback data');
                renderFallbackChart();
                return;
            }

            // Group hourly data by day and calculate daily averages
            const dailyData = {};
            data.list.forEach(entry => {
                const date = new Date(entry.dt * 1000).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                });
                if (!dailyData[date]) {
                    dailyData[date] = {
                        aqiSum: 0,
                        pm25Sum: 0,
                        pm10Sum: 0,
                        count: 0
                    };
                }
                const components = entry.components;
                const pm25Aqi = calculatePM25AQI(components.pm2_5);
                const pm10Aqi = calculatePM10AQI(components.pm10);
                const o3Aqi = calculateO3AQI(components.o3);
                const no2Aqi = calculateNO2AQI(components.no2);
                const so2Aqi = calculateSO2AQI(components.so2);
                const coAqi = calculateCOAQI(components.co);
                const entryAqi = Math.max(pm25Aqi, pm10Aqi, o3Aqi, no2Aqi, so2Aqi, coAqi);
                dailyData[date].aqiSum += entryAqi;
                dailyData[date].pm25Sum += components.pm2_5;
                dailyData[date].pm10Sum += components.pm10;
                dailyData[date].count += 1;
            });

            // Get up to 5 days
            const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b)).slice(-5);
            const labels = sortedDates.map(date => new Date(date).toLocaleDateString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric' 
            }));

            const avgAQI = sortedDates.map(date => Math.round(dailyData[date].aqiSum / dailyData[date].count));
            const avgPM25 = sortedDates.map(date => (dailyData[date].pm25Sum / dailyData[date].count).toFixed(1));
            const avgPM10 = sortedDates.map(date => (dailyData[date].pm10Sum / dailyData[date].count).toFixed(1));

            console.log('Chart Labels:', labels);
            console.log('Chart Data:', { avgAQI, avgPM25, avgPM10 });

            // Render Chart.js line chart
            const ctx = document.getElementById('aqiTrendChart')?.getContext('2d');
            if (!ctx) {
                console.error('Canvas element with ID "aqiTrendChart" not found');
                const healthMessage = document.getElementById('health-message');
                if (healthMessage) {
                    healthMessage.textContent = 'Trend chart not available: Canvas element missing';
                }
                return;
            }

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'AQI',
                            data: avgAQI,
                            borderColor: '#ff6384',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            fill: false,
                            tension: 0.1,
                            yAxisID: 'y'
                        },
                        {
                            label: 'PM2.5 (µg/m³)',
                            data: avgPM25,
                            borderColor: '#36a2eb',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: false,
                            tension: 0.1,
                            yAxisID: 'y1'
                        },
                        {
                            label: 'PM10 (µg/m³)',
                            data: avgPM10,
                            borderColor: '#ffce56',
                            backgroundColor: 'rgba(255, 206, 86, 0.2)',
                            fill: false,
                            tension: 0.1,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date',
                                color: '#f5f5f5'
                            },
                            ticks: {
                                color: '#f5f5f5'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'AQI',
                                color: '#f5f5f5'
                            },
                            ticks: {
                                color: '#f5f5f5'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        },
                        y1: {
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Pollutants (µg/m³)',
                                color: '#f5f5f5'
                            },
                            ticks: {
                                color: '#f5f5f5'
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#f5f5f5'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Air Quality Trends (Next 5 Days Forecast)',
                            color: '#f5f5f5'
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching air pollution forecast:', error);
            const healthMessage = document.getElementById('health-message');
            if (healthMessage) {
                healthMessage.textContent = 'Trend data not available';
            }
            renderFallbackChart();
        });

    // Fallback chart if API fails
    function renderFallbackChart() {
        const ctx = document.getElementById('aqiTrendChart')?.getContext('2d');
        if (!ctx) {
            console.error('Canvas element with ID "aqiTrendChart" not found');
            return;
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
                datasets: [
                    {
                        label: 'AQI',
                        data: [0, 0, 0, 0, 0],
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'PM2.5 (µg/m³)',
                        data: [0, 0, 0, 0, 0],
                        borderColor: '#36a2eb',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'PM10 (µg/m³)',
                        data: [0, 0, 0, 0, 0],
                        borderColor: '#ffce56',
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#f5f5f5'
                        },
                        ticks: {
                            color: '#f5f5f5'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'AQI',
                            color: '#f5f5f5'
                        },
                        ticks: {
                            color: '#f5f5f5'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#f5f5f5'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Air Quality Trends (Data Unavailable)',
                        color: '#f5f5f5'
                    }
                }
            }
        });
    }
});
