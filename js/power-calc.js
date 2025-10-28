// js/power-calc.js
import { CALC_G_STC, CALC_PERFORMANCE_RATIO } from './api-key.js';

export function solarCalcInstantaneousPower(date, lat, lon, totalRatedWatts) {
    const sunPos = SunCalc.getPosition(date, lat, lon);
    const solarAltitudeRad = sunPos.altitude;
    const G_actual = CALC_G_STC * Math.max(0, Math.sin(solarAltitudeRad));
    const expectedPower = totalRatedWatts * (G_actual / CALC_G_STC) * CALC_PERFORMANCE_RATIO;
    return { power: Math.max(0, expectedPower), radiation: G_actual };
}

export function solarCalcOptimalAngle(lat) {
    const tilt = Math.abs(lat);
    const direction = lat >= 0 ? 'True South (180°)' : 'True North (0°)';
    return { tilt: tilt.toFixed(1), direction: direction };
}

function updateSolarPower() {
    const numPanels = parseFloat(document.getElementById('calc-panels').value || 0);
    const panelWatts = parseFloat(document.getElementById('calc-watts').value || 0);
    const lat = parseFloat(document.getElementById('calc-latitude').value || 0);
    const lon = parseFloat(document.getElementById('calc-longitude').value || 0);
    const totalRatedWatts = numPanels * panelWatts;
    const now = new Date();

    if (totalRatedWatts <= 0 || isNaN(lat) || isNaN(lon) || !lat || !lon) {
        document.getElementById('calculated-currentPower').textContent = '-- W';
        document.getElementById('calculated-bestAngle').textContent = '-- °';
        return;
    }

    const { power: currentPower } = solarCalcInstantaneousPower(now, lat, lon, totalRatedWatts);
    const { tilt: optimalTilt, direction } = solarCalcOptimalAngle(lat);
    document.getElementById('calculated-currentPower').textContent = `${currentPower.toFixed(0)} W`;
    document.getElementById('calculated-bestAngle').textContent = `${optimalTilt}° (facing ${direction})`;
}

document.addEventListener('DOMContentLoaded', () => {
    updateSolarPower();
    setInterval(updateSolarPower, 60000);
    document.getElementById('solarCalcForm').addEventListener('input', updateSolarPower);
});
