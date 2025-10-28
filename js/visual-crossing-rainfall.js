// visual-crossing-rainfall.js
// Weather data from Visual Crossing API

// Configuration
// **FIXED:** Import constants from the centralized configuration file (api-key.js)
import { 
    GLOBAL_API_KEY as VISUAL_CROSSING_API_KEY, 
    GLOBAL_LOCATION as LOCATION, 
    GLOBAL_API_URL as VISUAL_CROSSING_URL 
} from './api-key.js'; 

// DOM Elements
const totalRainfallElement = document.getElementById('total-rainfall');
const solarRadiationElement = document.getElementById('solar-radiation');

class VisualCrossingData {
    constructor() {
        this.init();
    }

    init() {
        this.fetchWeatherData();
        setInterval(() => this.fetchWeatherData(), 10 * 60 * 1000);
    }

    async fetchWeatherData() {
        try {
            if (totalRainfallElement) totalRainfallElement.textContent = '...';
            if (solarRadiationElement) solarRadiationElement.textContent = '...';

            const url = `${VISUAL_CROSSING_URL}${encodeURIComponent(LOCATION)}/today?key=${VISUAL_CROSSING_API_KEY}&include=days,current&unitGroup=us&contentType=json`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Visual Crossing API error: ${response.status}`);
            }
            
            const data = await response.json();
            this.updateRainfall(data);
            this.updateSolarRadiation(data);
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showErrors();
        }
    }

    updateRainfall(data) {
        if (!totalRainfallElement) return;

        let precipitation = 0;
        
        if (data.days && data.days.length > 0) {
            precipitation = data.days[0].precip || 0;
        }

        let precipitationText;
        if (precipitation === 0) {
            precipitationText = '0 in';
        } else if (precipitation < 0.01) {
            precipitationText = '< 0.01 in';
        } else {
            precipitationText = `${precipitation.toFixed(2)} in`;
        }
        
        totalRainfallElement.textContent = precipitationText;
    }

    updateSolarRadiation(data) {
        if (!solarRadiationElement) return;

        let solarRadiation = 0;
        
        if (data.currentConditions) {
            solarRadiation = data.currentConditions.solarradiation || 0;
        }

        solarRadiationElement.textContent = `${solarRadiation} W/m²`;
    }

    showErrors() {
        if (totalRainfallElement) {
            totalRainfallElement.textContent = 'Error';
            totalRainfallElement.style.color = '#ff6b6b';
        }
        if (solarRadiationElement) {
            solarRadiationElement.textContent = 'Error';
            solarRadiationElement.style.color = '#ff6b6b';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new VisualCrossingData();
});
