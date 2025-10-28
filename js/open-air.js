// OpenWeatherMap Configuration
import { 
    OWM_API_KEY as OPENWEATHER_API_KEY, 
    OWM_LAT as OPENWEATHER_LAT, 
    OWM_LON as OPENWEATHER_LON 
} from './api-key.js';
// DOM elements
const temperatureElement = document.getElementById('temperature');
const degreeSymbol = document.getElementById('degreeSymbol');
const descriptionElement = document.getElementById('description');
const errorElement = document.getElementById('error');

// Fetch weather data from OpenWeatherMap
async function fetchWeatherData() {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${OPENWEATHER_LAT}&lon=${OPENWEATHER_LON}&appid=${OPENWEATHER_API_KEY}&units=imperial`
        );

        if (!response.ok) {
            throw new Error('Weather data not available');
        }

        const data = await response.json();
        updateWeatherDisplay(data);

        // Fetch additional data (UV index)
        fetchAdditionalWeatherData();

    } catch (error) {
        console.error('Error fetching weather data:', error);
        if (errorElement) {
            errorElement.textContent = 'Unable to fetch weather data. Please check your API key.';
        }
    }
}

// Fetch additional weather data (UV index)
async function fetchAdditionalWeatherData() {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/uvi?lat=${OPENWEATHER_LAT}&lon=${OPENWEATHER_LON}&appid=${OPENWEATHER_API_KEY}`
        );

        if (response.ok) {
            const uvData = await response.json();
            document.getElementById('uv-index').textContent = uvData.value.toFixed(1);
        }
    } catch (error) {
        console.error('Error fetching UV data:', error);
    }
}

// Update the display with weather data, including sunrise/sunset
function updateWeatherDisplay(data) {
    const tempF = Math.round(data.main.temp);
    const weatherDescription = data.weather[0].description;
    const weatherIcon = data.weather[0].icon;

    // Update DOM elements
    temperatureElement.textContent = tempF;
    descriptionElement.textContent = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);

    // Add weather icon
    const iconUrl = `icons/${weatherIcon}.svg`;
    document.getElementById('weatherIcon').src = iconUrl;

    // Update detailed weather data in left column
    document.getElementById('temperature-main').textContent = `${tempF}°F`;
    document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°F`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('wind-speed').textContent = `${Math.round(data.wind.speed)} mph`;
    document.getElementById('wind-direction').textContent = `${getWindDirection(data.wind.deg)}`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1609.34).toFixed(1)} mi`;
    document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;
    document.getElementById('dew-point').textContent = `${Math.round(data.main.temp - (100 - data.main.humidity)/5)}°F`;
    document.getElementById('wind-gust').textContent = data.wind.gust ? `${Math.round(data.wind.gust)} mph` : '--';
    document.getElementById('rain-1h').textContent = data.rain && data.rain['1h'] ? `${data.rain['1h']} mm` : '--';
    document.getElementById('snow-1h').textContent = data.snow && data.snow['1h'] ? `${data.snow['1h']} mm` : '--';
    
    // SUNRISE/SUNSET LOGIC
    const sunriseTimestamp = data.sys.sunrise * 1000;
    const sunsetTimestamp = data.sys.sunset * 1000;

    const sunriseTime = new Date(sunriseTimestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const sunsetTime = new Date(sunsetTimestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Set values and icons with file paths
    document.getElementById('sunriseIcon').src = `icons/sunrise.svg`;
    document.getElementById('sunriseValue').textContent = sunriseTime;

    document.getElementById('sunsetIcon').src = `icons/sunset.svg`;
    document.getElementById('sunsetValue').textContent = sunsetTime;

    // Clear any previous errors
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Helper function to convert wind degrees to direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Fetch weather data
    fetchWeatherData();

    // Fetch air quality data (from airnow.js)
    if (typeof fetchAirQualityData !== 'undefined') {
        fetchAirQualityData();
    }

    // Update weather every 10 minutes
    setInterval(fetchWeatherData, 600000);

    // Update air quality every hour
    if (typeof fetchAirQualityData !== 'undefined') {
        setInterval(fetchAirQualityData, 3600000);
    }
});
