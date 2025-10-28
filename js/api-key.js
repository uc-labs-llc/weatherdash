// js/api-key.js
// --- Global API Keys and Locations ---
export const GLOBAL_API_KEY = 'DEMO_GLOBAL_API_KEY_12345ABCXYZ';
export const GLOBAL_LOCATION = 'Faketown, State';
export const GLOBAL_API_URL = 'https://demo.api.visualcrossing.com/services/timeline/';
export const CALC_G_STC = 1000; // Standard Test Conditions radiation (W/m²)
export const CALC_PERFORMANCE_RATIO = 0.8; // Performance ratio for solar power calculation

// OpenWeatherMap
export const OWM_API_KEY = 'demo_openweathermap_key_987654321';
export const OWM_LAT = 40.7128; // New York City (Demo Lat)
export const OWM_LON = -74.0060; // New York City (Demo Lon)
export const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather';

// OpenWeatherMap / Forecast
export const FCAST_API_KEY = 'demo_forecast_key_abc123def456ghi789';
export const FCAST_LAT = 34.0522; // Los Angeles (Demo Lat)
export const FCAST_LON = -118.2437; // Los Angeles (Demo Lon)
export const FCAST_STORAGE_KEY = 'demoForecastStorage';
export const FCAST_TIMESTAMP_KEY = 'demoForecastTimestamp';

// Moon/Solar Location Data (Moved from moontracker.js)
export const LOCATION = {
    name: "DemoCity",
    state: "DemoState",
    timezone: "America/Demo_Zone",
    // Latitude and Longitude for accurate moon calculation
    lat: 30.2672, // Austin (Demo Lat)
    lng: -97.7431 // Austin (Demo Lon)
};

// Irrigation & Clock Latitude/Longitude (Moved from irrigation.html)
export const LAT = 41.8781; // Chicago (Demo Lat)
export const LON = -87.6298; // Chicago (Demo Lon)
