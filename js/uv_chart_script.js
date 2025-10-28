// Constants (Prefixed IDs)
const API_URL = "https://data.epa.gov/efservice/getEnvirofactsUVHourly/ZIP/78565/JSON";
const statusMessage = document.getElementById('uv-status-message');
const chartContainer = document.getElementById('uv-chart-container');

// Define UV Index thresholds and colors (using explicit RGB values for chart.js)
const UV_INDEX_MAP = [
    { max: 2, color: 'rgb(74, 222, 128)' },   // Low (Green)
    { max: 5, color: 'rgb(250, 204, 21)' },   // Moderate (Yellow)
    { max: 7, color: 'rgb(251, 146, 60)' },   // High (Orange)
    { max: 10, color: 'rgb(248, 113, 113)' }, // Very High (Red)
    { max: Infinity, color: 'rgb(167, 139, 250)' } // Extreme (Violet)
];

/**
 * Gets the corresponding color for a given UV value.
 * @param {number} uvValue 
 * @returns {string} The RGB color string.
 */
function getUVColor(uvValue) {
    const index = UV_INDEX_MAP.find(item => uvValue <= item.max);
    return index ? index.color : 'rgb(100, 116, 139)'; // Fallback to slate
}

/**
 * Converts EPA's "MMM/DD/YYYY HH AM/PM" format to a human-readable time string (e.g., "6 AM").
 * @param {string} dateTimeString 
 * @returns {string} Formatted time string (Time part only).
 */
function formatHour(dateTimeString) {
    if (dateTimeString) {
        // Splits "Oct/18/2025 06 AM" into ["Oct/18/2025", "06", "AM"]
        const parts = dateTimeString.split(' ');
        if (parts.length >= 3) {
            // Combine the hour and AM/PM parts: "06 AM"
            return `${parts[1].replace(/^0/, '')} ${parts[2]}`; // Remove leading zero from hour
        }
    }
    return 'Time Unknown';
}

/**
 * Fetches UV Index data and prepares it for Chart.js.
 */
async function fetchUVData() {
    // Initial display check
    if (!statusMessage) {
        console.error("UV status message element not found!");
        return;
    }
    statusMessage.textContent = 'Fetching data...';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            statusMessage.textContent = 'No UV data found for this ZIP code today.';
            return;
        }

        const rawDateTime = data[0]?.DATE_TIME;
        let todayPrefix = null;

        if (rawDateTime) {
            // Date part is the first element when splitting by space: "Oct/18/2025"
            todayPrefix = rawDateTime.split(' ')[0];
        }
        
        // Filter for data matching today's date prefix
        const filteredData = data.filter(item => item.DATE_TIME && item.UV_VALUE !== null && item.DATE_TIME.startsWith(todayPrefix));
        
        if (filteredData.length === 0) {
            statusMessage.textContent = 'No current or valid hourly UV data available.';
            return;
        }
        
        // Extract and format data for the chart
        const labels = filteredData.map(item => formatHour(item.DATE_TIME));
        const uvValues = filteredData.map(item => item.UV_VALUE);
        const backgroundColors = uvValues.map(getUVColor);
        
        const firstItem = filteredData[0];
        
        // Use CITY and STATE fields from the API structure
        const cityName = firstItem?.CITY || 'Unknown City'; 
        const stateName = firstItem?.STATE || 'TX';
        const formattedDate = todayPrefix || 'Unknown Date';

        // Update location info (Prefixed ID)
        const locationInfo = document.getElementById('uv-location-info');
        if (locationInfo) {
            locationInfo.textContent = `${cityName}, ${stateName} | Date: ${formattedDate}`;
        }
        
        // Hide status and show chart (Prefixed IDs)
        statusMessage.classList.add('hidden');
        if (chartContainer) {
            chartContainer.classList.remove('hidden');
        }

        renderChart(labels, uvValues, backgroundColors);

    } catch (error) {
        console.error("Error fetching or processing UV data:", error);
        if (statusMessage) {
            statusMessage.textContent = `Error loading data: Network or API issue. See console for details.`;
        }
        if (chartContainer) {
            chartContainer.classList.add('hidden');
        }
    }
}

/**
 * Renders the Chart.js bar chart.
 * @param {string[]} labels - Hourly time labels.
 * @param {number[]} data - UV Index values.
 * @param {string[]} colors - Background colors for each bar.
 */
function renderChart(labels, data, colors) {
    const ctx = document.getElementById('uv-bar-chart');
    if (!ctx) {
        console.error("Chart canvas element not found!");
        return;
    }
    
    const context = ctx.getContext('2d');

    // Destroy existing chart if it exists to prevent double rendering issues
    if (window.uvChartInstance) {
        window.uvChartInstance.destroy();
    }

    window.uvChartInstance = new Chart(context, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'UV Index Value',
                data: data,
                backgroundColor: colors,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Hourly UV Index',
                    color: '#e2e8f0', // slate-200
                    font: { size: 18 }
                },
                tooltip: {
                    backgroundColor: 'rgb(30, 41, 59, 0.9)', // Using dark-card RGB
                    titleColor: '#e2e8f0',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label && context.parsed.y !== null) {
                                label += `: ${context.parsed.y}`;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 12, 
                    title: { display: true, text: 'UV Index', color: '#94a3b8' },
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)', borderColor: '#334155' }
                },
                x: {
                    title: { display: true, text: 'Time of Day', color: '#94a3b8' },
                    ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 45 },
                    grid: { display: false, borderColor: '#334155' }
                }
            }
        }
    });
}

// Run the main function when the window loads
window.onload = fetchUVData;

