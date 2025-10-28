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

        /** Converts a decimal phase (0 to 1) to a descriptive string */
        function getPhaseName(phase) {
            // New logic: Tighten the definition of New Moon to prevent premature labeling.
            // This ensures that immediately after the New Moon (11:26 AM CDT), 
            // the phase switches from New Moon (0.0/1.0) to Waxing Crescent (0.01+).
            
            // New Moon (Extremely tight tolerance around 0.0 and 1.0)
            if (phase < 0.005) return "New Moon 🌑 (Aligning)"; 
            if (phase > 0.995) return "New Moon 🌑 (Aligning)"; 
            
            // Waxing Phases (0.005 up to 0.5)
            if (phase < 0.25) return "Waxing Crescent 🌒";
            if (phase < 0.28) return "First Quarter 🌓";
            if (phase < 0.47) return "Waxing Gibbous 🌔";
            
            // Full Moon (Tight tolerance around 0.5)
            if (phase < 0.53) return "Full Moon 🌕";
            
            // Waning Phases (0.53 up to 0.995)
            if (phase < 0.72) return "Waning Gibbous 🌖";
            if (phase < 0.78) return "Last Quarter 🌗";
            if (phase < 0.995) return "Waning Crescent 🌘";
            
            return "Unknown";
        }

        // --- 1. Moonrise and Moonset ---
        // getMoonTimes(date, latitude, longitude, alwaysReturn)
        // Set alwaysReturn=true to ensure an object is returned even if the moon never rises/sets
        const moonTimes = SunCalc.getMoonTimes(currentDate, latitude, longitude, true);

        const moonriseEl = document.getElementById('moonrise');
        const moonsetEl = document.getElementById('moonset');

        if (moonTimes.rise) {
            moonriseEl.textContent = moonTimes.rise.toLocaleTimeString('en-US', TIME_OPTIONS);
        } else if (moonTimes.set) {
            // Moon is circumpolar (never sets) or is up all day (rises before midnight)
            moonriseEl.textContent = "Did not rise today";
        } else {
            // Check if it's currently up
            const moonPosition = SunCalc.getMoonPosition(currentDate, latitude, longitude);
            moonriseEl.textContent = moonPosition.altitude > 0 ? "Currently up (rose yesterday)" : "Below horizon all day";
        }

        if (moonTimes.set) {
            moonsetEl.textContent = moonTimes.set.toLocaleTimeString('en-US', TIME_OPTIONS);
        } else if (moonTimes.rise) {
            // Moon is never up (circumpolar) or sets tomorrow
            moonsetEl.textContent = "Did not set today";
        } else {
            // Check if it's currently up
            const moonPosition = SunCalc.getMoonPosition(currentDate, latitude, longitude);
            moonsetEl.textContent = moonPosition.altitude > 0 ? "Currently up (sets tomorrow)" : "Below horizon all day";
        }


        // --- 2. Phase and Illumination ---
        // getMoonIllumination(date)
        const moonIllumination = SunCalc.getMoonIllumination(currentDate);
        
        const illuminationPercent = (moonIllumination.fraction * 100).toFixed(1);
        const phaseName = getPhaseName(moonIllumination.phase);

        document.getElementById('phase').textContent = phaseName;
        document.getElementById('illumination').textContent = `${illuminationPercent}%`;
        
        // --- 3. Altitude and Azimuth ---
        // getMoonPosition(date, latitude, longitude)
        const moonPosition = SunCalc.getMoonPosition(currentDate, latitude, longitude);

        // Altitude: Angle above horizon. Convert radians to degrees.
        const altitudeDeg = (moonPosition.altitude * 180 / Math.PI).toFixed(2);
        
        // Azimuth: Horizontal direction (0=North, 90=East, 180=South, 270=West). Convert radians to degrees.
        // Adjust SunCalc's Azimuth (South=0) to standard (North=0)
        let azimuthDeg = (moonPosition.azimuth * 180 / Math.PI);
        azimuthDeg = (azimuthDeg + 180) % 360; // Convert SunCalc's south-based Azimuth to North-based

        const azimuthCardinal = degreesToCardinal(azimuthDeg);

        document.getElementById('altitude').textContent = `${altitudeDeg}° (Degrees above horizon)`;
        document.getElementById('azimuth').textContent = `${azimuthDeg.toFixed(2)}° (${azimuthCardinal})`;
    });
