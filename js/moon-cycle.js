document.addEventListener('DOMContentLoaded', () => {
        // --- Constants & Current State ---
        const DATE_OPTIONS = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const SYNODIC_MONTH = 29.53059; // Average length of a lunar cycle in days
        const currentDate = new Date();
        
        // **LOCATION FOR LOS EBANOS, TX**
        const latitude = 26.24; 
        const longitude = -98.56; 

        // Display current date/time
        document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('en-US', DATE_OPTIONS);

        // --- Core Illumination Calculation ---
        // Location (lat/lon) is provided but is mostly relevant for local rise/set times, 
        // while phase/illumination is largely the same globally.
        const moonIllumination = SunCalc.getMoonIllumination(currentDate);
        
        // The phase property is a value from 0 to 1, where 0 and 1 are New Moon, and 0.5 is Full Moon.
        const phaseValue = moonIllumination.phase; 
        
        // --- Moon's Age & Cycle Progress ---
        const moonAgeDays = (phaseValue * SYNODIC_MONTH).toFixed(2);
        const cycleProgressPercent = (phaseValue * 100).toFixed(0);

        document.getElementById('moonAge').textContent = `${moonAgeDays} days`;
        document.getElementById('lunarProgressText').textContent = `${cycleProgressPercent}% complete`;
        document.getElementById('lunarProgress').value = cycleProgressPercent;
        
        // --- Phase Calculation Helper Function ---
        /**
         * Iteratively searches for the date of the next major lunar phase (New or Full).
         * @param {Date} startDate The date to start searching from.
         * @param {number} targetPhase The phase value to look for (0.0 for New, 0.5 for Full).
         * @returns {string} The formatted date of the next phase.
         */
        function findNextPhase(startDate, targetPhase) {
            let date = new Date(startDate);
            // Use a small tolerance for floating point comparison
            const tolerance = 0.015; 
            const maxDays = 60; // Safety limit (max one synodic month)
            
            for (let days = 0; days < maxDays; days++) {
                // Check the phase at midnight of the next day
                date.setDate(date.getDate() + 1);
                
                let illumination = SunCalc.getMoonIllumination(date);
                let currentPhase = illumination.phase;

                if (targetPhase === 0.0) { // New Moon check (0.0 or 1.0)
                    if (currentPhase < tolerance || currentPhase > 1 - tolerance) {
                        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                    }
                } else if (Math.abs(currentPhase - targetPhase) < tolerance) { // Full Moon check (0.5)
                    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                }
            }
            return "Unable to calculate next phase.";
        }

        // --- Calculate and Display Next Phases ---
        const nextNewMoonDate = findNextPhase(currentDate, 0.0);
        const nextFullMoonDate = findNextPhase(currentDate, 0.5);

        document.getElementById('nextNewMoon').textContent = nextNewMoonDate;
        document.getElementById('nextFullMoon').textContent = nextFullMoonDate;
    });
