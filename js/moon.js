const MOON_PHASES = {
    'New Moon': 'moon-new.svg',
    'Waxing Crescent': 'moon-waxing-crescent.svg',
    'First Quarter': 'moon-first-quarter.svg',
    'Waxing Gibbous': 'moon-waxing-gibbous.svg',
    'Full Moon': 'moon-full.svg',
    'Waning Gibbous': 'moon-waning-gibbous.svg',
    'Last Quarter': 'moon-last-quarter.svg',
    'Waning Crescent': 'moon-waning-crescent.svg'
};

function calculateMoonPhase() {
    const today = new Date();
    const knownNewMoon = new Date(2000, 0, 6); // Known new moon reference
    const lunarCycle = 29.530588853; // Lunar cycle in days
    const daysSinceKnown = (today - knownNewMoon) / (1000 * 60 * 60 * 24);
    const currentPhase = (daysSinceKnown % lunarCycle) / lunarCycle;
    return getPhaseFromDecimal(currentPhase);
}

function getPhaseFromDecimal(phaseDecimal) {
    if (phaseDecimal < 0.03 || phaseDecimal >= 0.97) return 'New Moon';
    if (phaseDecimal < 0.22) return 'Waxing Crescent';
    if (phaseDecimal < 0.28) return 'First Quarter';
    if (phaseDecimal < 0.47) return 'Waxing Gibbous';
    if (phaseDecimal < 0.53) return 'Full Moon';
    if (phaseDecimal < 0.72) return 'Waning Gibbous';
    if (phaseDecimal < 0.78) return 'Last Quarter';
    return 'Waning Crescent';
}

function getMoonIcon(phase) {
    return `icons/${MOON_PHASES[phase] || MOON_PHASES['New Moon']}`;
}

function calculateMoonAge() {
    const knownNewMoon = new Date(2000, 0, 6);
    const lunarCycle = 29.530588853;
    const daysSinceKnown = (new Date() - knownNewMoon) / (1000 * 60 * 60 * 24);
    return (daysSinceKnown % lunarCycle).toFixed(1);
}

function calculateIllumination(phaseDecimal) {
    if (phaseDecimal <= 0.25) {
        return Math.round((phaseDecimal / 0.25) * 50);
    } else if (phaseDecimal <= 0.5) {
        return Math.round(50 + ((phaseDecimal - 0.25) / 0.25) * 50);
    } else if (phaseDecimal <= 0.75) {
        return Math.round(100 - ((phaseDecimal - 0.5) / 0.25) * 50);
    } else {
        return Math.round(50 - ((phaseDecimal - 0.75) / 0.25) * 50);
    }
}

function getNextFullMoon() {
    const today = new Date();
    const knownFullMoon = new Date(2000, 0, 20);
    const lunarCycle = 29.530588853;
    const daysSinceKnown = (today - knownFullMoon) / (1000 * 60 * 60 * 24);
    const daysUntilNext = lunarCycle - (daysSinceKnown % lunarCycle);
    const nextFullMoon = new Date(today);
    nextFullMoon.setDate(today.getDate() + Math.ceil(daysUntilNext));
    return nextFullMoon;
}

function getNextNewMoon() {
    const today = new Date();
    const knownNewMoon = new Date(2000, 0, 6);
    const lunarCycle = 29.530588853;
    const daysSinceKnown = (today - knownNewMoon) / (1000 * 60 * 60 * 24);
    const daysUntilNext = lunarCycle - (daysSinceKnown % lunarCycle);
    const nextNewMoon = new Date(today);
    nextNewMoon.setDate(today.getDate() + Math.ceil(daysUntilNext));
    return nextNewMoon;
}

function getMoonDistance() {
    const baseDistance = 238855;
    const variation = Math.random() * 13232 - 6616;
    return Math.round(baseDistance + variation).toLocaleString();
}

function calculateMoonTimes() {
    const now = new Date();
    const lat = 26.2434; // Latitude for Deep South Texas (e.g., Brownsville)
    const lon = -98.5617; // Longitude for Deep South Texas
    const moonTimes = SunCalc.getMoonTimes(now, lat, lon);
    return {
        moonrise: moonTimes.rise ? moonTimes.rise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--:--',
        moonset: moonTimes.set ? moonTimes.set.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--:--'
    };
}

function updateMoonDisplay() {
    try {
        const moonPhase = calculateMoonPhase();
        const moonIcon = getMoonIcon(moonPhase);
        const knownNewMoon = new Date(2000, 0, 6);
        const lunarCycle = 29.530588853;
        const daysSinceKnown = (new Date() - knownNewMoon) / (1000 * 60 * 60 * 24);
        const phaseDecimal = (daysSinceKnown % lunarCycle) / lunarCycle;
        const illumination = calculateIllumination(phaseDecimal);
        const moonAge = calculateMoonAge();
        const nextFullMoon = getNextFullMoon();
        const nextNewMoon = getNextNewMoon();
        const moonTimes = calculateMoonTimes();
        const moonDistance = getMoonDistance();

        const elements = {
            'moon-icon': { src: moonIcon },
            'moon-phase-name': { textContent: moonPhase },
            'moon-illumination': { textContent: `${illumination}% Illuminated` },
            'moon-age': { textContent: `${moonAge} days` },
            'moon-distance': { textContent: `${moonDistance} mi` },
            'next-full-moon': { textContent: nextFullMoon.toLocaleDateString() },
            'next-new-moon': { textContent: nextNewMoon.toLocaleDateString() },
            'moonrise-time': { textContent: moonTimes.moonrise },
            'moonset-time': { textContent: moonTimes.moonset },
            'cycle-progress': { style: `width: ${(phaseDecimal * 100).toFixed(1)}%` },
            'current-cycle-day': { textContent: `Day ${Math.floor(parseFloat(moonAge))}` }
        };

        Object.entries(elements).forEach(([id, updates]) => {
            const element = document.getElementById(id);
            if (element) {
                Object.entries(updates).forEach(([property, value]) => {
                    element[property] = value;
                });
            }
        });

        console.log('Moon display updated:', moonPhase);
    } catch (error) {
        console.error('Error updating moon display:', error);
    }
}

function createMoonPhaseHTML() {
    return `
        <div class="moon-phase-container">
            <div class="moon-header">
            </div>
            <div class="moon-content">
                <!-- Moon Visual Section -->
                <div class="moon-visual">
                    <img id="moon-icon" src="icons/moon-new.svg" alt="Moon Phase" width="100">
                    <div class="moon-phase-name" id="moon-phase-name">Calculating...</div>
                    <div class="moon-illumination" id="moon-illumination">--% Illuminated</div>
                </div>
                <!-- Moon Statistics -->
                <div class="moon-stats">
                    <div class="moon-stat">
                        <span class="stat-label">Moon Age:</span>
                        <span class="stat-value" id="moon-age">--</span>
                    </div>
                    <div class="moon-stat">
                        <span class="stat-label">Distance:</span>
                        <span class="stat-value" id="moon-distance">--</span>
                    </div>
                    <div class="moon-stat">
                        <span class="stat-label">Next Full Moon:</span>
                        <span class="stat-value" id="next-full-moon">--</span>
                    </div>
                    <div class="moon-stat">
                        <span class="stat-label">Next New Moon:</span>
                        <span class="stat-value" id="next-new-moon">--</span>
                    </div>
                </div>
                <!-- Moon Times -->
                <div class="moon-times">
                    <div class="moon-time">
                        <img src="icons/moonrise.svg" alt="Moonrise" width="20">
                        <span id="moonrise-time">--:--</span>
                    </div>
                    <div class="moon-time">
                        <img src="icons/moonset.svg" alt="Moonset" width="20">
                        <span id="moonset-time">--:--</span>
                    </div>
                </div>
                <!-- Moon Cycle Progress -->
                <div class="moon-cycle">
                    <h4>Lunar Cycle Progress</h4>
                    <div class="cycle-bar">
                        <div class="cycle-progress" id="cycle-progress"></div>
                    </div>
                    <div class="cycle-days">
                        <span>New Moon</span>
                        <span id="current-cycle-day">Day --</span>
                        <span>Full Moon</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initializeMoonPhase(containerElement) {
    if (!containerElement) {
        console.error('Moon phase container element not found');
        return;
    }
    containerElement.innerHTML = createMoonPhaseHTML();
    updateMoonDisplay();
    setInterval(updateMoonDisplay, 60 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    const moonContainer = document.getElementById('moon-phase-container');
    if (moonContainer) {
        initializeMoonPhase(moonContainer);
    }
});

window.updateMoonDisplay = updateMoonDisplay;
window.initializeMoonPhase = initializeMoonPhase;
