document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const DATE_OPTIONS = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const TIME_OPTIONS = { hour: '2-digit', minute: '2-digit', hour12: true };
    
    const currentDate = new Date();
    
    // **LOCATION FOR LOS EBANOS, TX**
    const latitude = 26.24; 
    const longitude = -98.56; 

    // Display current date/time
    document.getElementById('currentDate1').textContent = currentDate.toLocaleDateString('en-US', DATE_OPTIONS);

    // --- Helper Functions ---

    /** Converts a decimal value (0-360) to a Cardinal Direction (N, NE, E, etc.) */
    function degreesToCardinal(deg) {
        const val = Math.floor((deg / 22.5) + 0.5);
        const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return arr[(val % 16)];
    }

    /** FIXED: Accurate moon phase name */
    function getPhaseName(phase) {
        if (phase < 0.03 || phase >= 0.97) return "New Moon (Aligning)"; 
        if (phase < 0.22) return "Waxing Crescent";
        if (phase < 0.28) return "First Quarter";
        if (phase < 0.47) return "Waxing Gibbous";
        if (phase < 0.53) return "Full Moon";
        if (phase < 0.72) return "Waning Gibbous";
        if (phase < 0.78) return "Last Quarter";
        return "Waning Crescent";
    }

    // --- 1. Moonrise and Moonset ---
    const moonTimes = SunCalc.getMoonTimes(currentDate, latitude, longitude, true);

    const moonriseEl = document.getElementById('moonrise');
    const moonsetEl = document.getElementById('moonset');

    if (moonTimes.rise) {
        moonriseEl.textContent = moonTimes.rise.toLocaleTimeString('en-US', TIME_OPTIONS);
    } else {
        moonriseEl.textContent = "Did not rise today";
    }

    if (moonTimes.set) {
        moonsetEl.textContent = moonTimes.set.toLocaleTimeString('en-US', TIME_OPTIONS);
    } else {
        moonsetEl.textContent = "Did not set today";
    }

    // --- 2. Phase and Illumination ---
    const moonIllumination = SunCalc.getMoonIllumination(currentDate);
    const illuminationPercent = (moonIllumination.fraction * 100).toFixed(1);
    const phaseName = getPhaseName(moonIllumination.phase);

    document.getElementById('phase').textContent = phaseName;
    document.getElementById('illumination').textContent = `${illuminationPercent}%`;
    
    // --- 3. Altitude and Azimuth ---
    const moonPosition = SunCalc.getMoonPosition(currentDate, latitude, longitude);
    const altitudeDeg = (moonPosition.altitude * 180 / Math.PI).toFixed(2);
    let azimuthDeg = (moonPosition.azimuth * 180 / Math.PI);
    azimuthDeg = (azimuthDeg + 180) % 360;
    const azimuthCardinal = degreesToCardinal(azimuthDeg);

    document.getElementById('altitude').textContent = `${altitudeDeg}° (Degrees above horizon)`;
    document.getElementById('azimuth').textContent = `${azimuthDeg.toFixed(2)}° (${azimuthCardinal})`;
});
