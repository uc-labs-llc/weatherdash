import { 
    FCAST_API_KEY as FORECAST_API_KEY, 
    FCAST_LAT as FORECAST_LAT, 
    FCAST_LON as FORECAST_LON, 
    FCAST_STORAGE_KEY as FORECAST_STORAGE_KEY, 
    FCAST_TIMESTAMP_KEY as FORECAST_TIMESTAMP_KEY 
} from './api-key.js';

async function getWeatherForecast() {
    try {
        // Check if we have recent data (less than 24 hours old)
        const storedData = getStoredForecast();
        if (storedData) {
            return storedData;
        }
        
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${FORECAST_LAT}&lon=${FORECAST_LON}&appid=${FORECAST_API_KEY}&units=imperial`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const forecastData = await response.json();
        
        // Process to get one forecast per day
        const dailyForecasts = [];
        const processedDays = new Set();
        
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            // Only take one forecast per day (around midday for best representation)
            if (!processedDays.has(dayKey) && date.getHours() >= 12 && date.getHours() <= 15) {
                processedDays.add(dayKey);
                dailyForecasts.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    temp: Math.round(item.main.temp),
                    humidity: item.main.humidity,
                    windSpeed: Math.round(item.wind.speed),
                    icon: item.weather[0].icon,
                    description: item.weather[0].description
                });
            }
        });
        
        // Return next 5 days and store them
        const fiveDayForecast = dailyForecasts.slice(0, 5);
        storeForecast(fiveDayForecast);
        return fiveDayForecast;
        
    } catch (error) {
        console.error(`Weather forecast fetch error: ${error.message}`);
        // Try to return stored data even if it's old
        const storedData = getStoredForecast(true); // force get even if expired
        return storedData || null;
    }
}

function getStoredForecast(forceReturn = false) {
    try {
        const storedData = localStorage.getItem(FORECAST_STORAGE_KEY);
        const storedTimestamp = localStorage.getItem(FORECAST_TIMESTAMP_KEY);
        
        if (storedData && storedTimestamp) {
            const now = new Date().getTime();
            const storedTime = parseInt(storedTimestamp);
            const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            
            // If data is less than 24 hours old, or we're forcing return
            if (forceReturn || (now - storedTime < twentyFourHours)) {
                return JSON.parse(storedData);
            }
        }
    } catch (error) {
        console.error('Error reading stored forecast:', error);
    }
    return null;
}

function storeForecast(forecastData) {
    try {
        localStorage.setItem(FORECAST_STORAGE_KEY, JSON.stringify(forecastData));
        localStorage.setItem(FORECAST_TIMESTAMP_KEY, new Date().getTime().toString());
    } catch (error) {
        console.error('Error storing forecast:', error);
    }
}

function displayForecast(forecastData) {
    const container = document.getElementById('weather-forecast');
    if (!container || !forecastData) return;
    
    container.innerHTML = forecastData.map(day => `
        <div class="forecast-day">
            <div class="forecast-date">${day.date}</div>
            <img class="forecast-icon" src="icons/${day.icon}.svg" alt="${day.description}">
            <div class="forecast-temp">${day.temp}°F</div>
            <div class="forecast-humidity">${day.humidity}%</div>
            <div class="forecast-wind">${day.windSpeed} mph</div>
        </div>
    `).join('');
}

// Initialize forecast when page loads
document.addEventListener('DOMContentLoaded', function() {
    getWeatherForecast().then(forecast => {
        if (forecast) {
            displayForecast(forecast);
        }
    });
});

// Optional: Export functions if needed elsewhere
window.weatherForecast = {
    getWeatherForecast,
    displayForecast,
    refreshForecast: function() {
        // Force refresh by clearing storage
        localStorage.removeItem(FORECAST_STORAGE_KEY);
        localStorage.removeItem(FORECAST_TIMESTAMP_KEY);
        getWeatherForecast().then(forecast => {
            if (forecast) {
                displayForecast(forecast);
            }
        });
    }
};
