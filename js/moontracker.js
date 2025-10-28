import { LOCATION } from './api-key.js'; // Import the location data

const MOON_SIZE = 40; // Size for moon phase SVGs
const SVG_SIZE = 40; // Size for moonrise/moonset SVGs

/**
 * Calculates the current position of the moon relative to the horizon
 * for visualization on the canvas.
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} canvasHeight - The height of the canvas.
 * @returns {object} An object containing moon position (x, y), visibility, and time data.
 */
function getMoonPosition(canvasWidth, canvasHeight) {
    if (typeof SunCalc === 'undefined') {
        // This is a safety check assuming SunCalc is loaded via script tag
        throw new Error("SunCalc library failed to load. Please check your internet connection.");
    }
    try {
        const now = moment().tz(LOCATION.timezone);
        
        // 1. Get times for today
        const todayTimes = SunCalc.getMoonTimes(now.toDate(), LOCATION.lat, LOCATION.lng);
        
        // 2. Get times for tomorrow (used to find the NEXT event)
        const tomorrowTimes = SunCalc.getMoonTimes(now.clone().add(1, 'day').toDate(), LOCATION.lat, LOCATION.lng);
        
        // --- Determine the NEXT relevant moonrise/moonset event ---
        let nextRiseMoment = todayTimes.rise ? moment(todayTimes.rise).tz(LOCATION.timezone) : null;
        let nextSetMoment = todayTimes.set ? moment(todayTimes.set).tz(LOCATION.timezone) : null;

        // If today's rise has passed, use tomorrow's rise
        if (nextRiseMoment && nextRiseMoment.isBefore(now)) {
            nextRiseMoment = tomorrowTimes.rise ? moment(tomorrowTimes.rise).tz(LOCATION.timezone) : null;
        }

        // If today's set has passed, use tomorrow's set
        if (nextSetMoment && nextSetMoment.isBefore(now)) {
            nextSetMoment = tomorrowTimes.set ? moment(tomorrowTimes.set).tz(LOCATION.timezone) : null;
        }
        
        // Helper function to format the moment, adding date if it's tomorrow
        const formatNextTime = (momentObj) => {
            if (!momentObj) return 'N/A';
            
            // If the event is NOT on the current calendar day, include the date (MMM D)
            const isTomorrowOrLater = !momentObj.isSame(now, 'day');
            
            // Use 'h:mm A (MMM D)' if it's not today, otherwise 'h:mm A'
            return momentObj.format(isTomorrowOrLater ? 'h:mm A (MMM D)' : 'h:mm A');
        };
        
        const formattedMoonrise = formatNextTime(nextRiseMoment);
        const formattedMoonset = formatNextTime(nextSetMoment);

        // --- Start Arc/Position Calculations (always based on current time) ---
        
        // The code for moon position (alt, az) must always use NOW
        const moonPos = SunCalc.getMoonPosition(now.toDate(), LOCATION.lat, LOCATION.lng);
        const moonIllumination = SunCalc.getMoonIllumination(now.toDate());
        
        // Check for edge cases (e.g., polar regions where times might be undefined)
        // We use the times calculated for the current day for this check, as we need the full day's cycle
        if (!todayTimes.rise && !todayTimes.set) {
            return {
                visible: false,
                moonrise: formattedMoonrise,
                moonset: formattedMoonset,
                current_time: now.format('h:mm A'),
                error: 'Moon times not calculable for this date/location.'
            };
        }

        const alt = moonPos.altitude * 180 / Math.PI; // Altitude (degrees)
        const az = moonPos.azimuth * 180 / Math.PI;   // Azimuth (degrees)

        const canvasWidth = 600; 
        const canvasHeight = 450;
        const arcRadius = (canvasWidth - 40) / 2;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight * 0.7;

        if (alt > 0) {
            // Moon is visible (above horizon)
            
            // Get the rise/set for the *current* lunar day to calculate arc progress
            const currentLunarDayRise = todayTimes.rise ? moment(todayTimes.rise).tz(LOCATION.timezone) : null;
            const currentLunarDaySet = todayTimes.set ? moment(todayTimes.set).tz(LOCATION.timezone) : null;

            let x = 0;
            let y = 0;

            if (currentLunarDayRise && currentLunarDaySet) {
                const dayLength = (currentLunarDaySet - currentLunarDayRise) / 1000; // in seconds
                const elapsed = (now - currentLunarDayRise) / 1000; // in seconds
                const progress = Math.min(1, Math.max(0, elapsed / dayLength));
                const angle = 180 * progress; // Angle from 0 (moonrise) to 180 (moonset)

                const rad = angle * Math.PI / 180;
                
                // Calculate X and Y position on the arc
                x = centerX - arcRadius * Math.cos(rad) - MOON_SIZE / 2;
                y = centerY - arcRadius * Math.sin(rad) - MOON_SIZE / 2;
                
                // Apply slight vertical adjustment for a more dramatic visual curve
                y = y - (90 - alt) * 0.6; 
            }


            return {
                x: Math.max(0, Math.min(canvasWidth - MOON_SIZE, x)),
                y: Math.max(0, Math.min(canvasHeight - MOON_SIZE, y)),
                visible: true,
                altitude: Math.round(alt * 10) / 10,
                azimuth: Math.round(az * 10) / 10,
                moonrise: formattedMoonrise, // Now includes date if tomorrow
                moonset: formattedMoonset,   // Now includes date if tomorrow
                current_time: now.format('h:mm A'),
                phaseName: getMoonPhaseName(moonIllumination.phase),
                phaseFraction: (moonIllumination.fraction * 100).toFixed(1),
                phaseSvgPath: getMoonPhaseSvg(moonIllumination.fraction, moonIllumination.phase)
            };
        }
        
        // Moon is below horizon
        return {
            visible: false,
            moonrise: formattedMoonrise, // Now includes date if tomorrow
            moonset: formattedMoonset,   // Now includes date if tomorrow
            current_time: now.format('h:mm A'),
            altitude: Math.round(alt * 10) / 10,
            azimuth: Math.round(az * 10) / 10,
            phaseName: getMoonPhaseName(moonIllumination.phase),
            phaseFraction: (moonIllumination.fraction * 100).toFixed(1),
            phaseSvgPath: getMoonPhaseSvg(moonIllumination.fraction, moonIllumination.phase)
        };
    } catch (e) {
        console.error("Moon calculation error:", e.message);
        return {
            visible: false,
            error: `Calculation error: ${e.message}`
        };
    }
}

/**
 * Determines the correct SVG filename for the current moon phase.
 * @param {number} fraction - The illuminated fraction (0 to 1).
 * @param {number} phase - The phase angle (0 to 1).
 * @returns {string} The path to the moon phase SVG file.
 */
function getMoonPhaseSvg(fraction, phase) {
    if (phase >= 0 && phase <= 0.01 || phase >= 0.99 && phase <= 1) return 'images/new-moon.svg';
    if (phase > 0.01 && phase < 0.25) return 'images/waxing-crescent.svg';
    if (phase >= 0.24 && phase <= 0.26) return 'images/first-quarter.svg';
    if (phase > 0.26 && phase < 0.5) return 'images/waxing-gibbous.svg';
    if (phase >= 0.49 && phase <= 0.51 && fraction > 0.95) return 'images/full-moon.svg';
    if (phase > 0.5 && phase < 0.74) return 'images/waning-gibbous.svg';
    if (phase >= 0.74 && phase <= 0.76) return 'images/last-quarter.svg';
    if (phase > 0.76 && phase < 0.99) return 'images/waning-crescent.svg';
    return 'images/moon.svg'; // Fallback
}

/**
 * Provides a common name for the moon phase based on the phase angle (0..1).
 */
function getMoonPhaseName(phase) {
    if (phase >= 0 && phase <= 0.01 || phase >= 0.99 && phase <= 1) return 'New Moon';
    if (phase > 0.01 && phase < 0.25) return 'Waxing Crescent';
    if (phase >= 0.24 && phase <= 0.26) return 'First Quarter';
    if (phase > 0.26 && phase < 0.5) return 'Waxing Gibbous';
    if (phase >= 0.49 && phase <= 0.51) return 'Full Moon';
    if (phase > 0.5 && phase < 0.74) return 'Waning Gibbous';
    if (phase >= 0.74 && phase <= 0.76) return 'Last Quarter';
    if (phase > 0.76 && phase < 0.99) return 'Waning Crescent';
    return 'Unknown Phase';
}

/**
 * Draws the arc, moonrise/moonset icons, and the current moon phase SVG on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} canvasHeight - The height of the canvas.
 * @param {object} moonData - The data object returned by getMoonPosition.
 */
function drawForeground(ctx, canvasWidth, canvasHeight, moonData) {
    // Clear canvas before redrawing
    // NOTE: We rely on the background image loading to clear the canvas first.
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); 

    const arcRadius = (canvasWidth - 40) / 2;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight * 0.7;

    // Draw arc (horizon line/path)
    ctx.beginPath();
    // Start at 180 degrees (left) and end at 360 degrees (right)
    ctx.arc(centerX, centerY, arcRadius, Math.PI, 2 * Math.PI); 
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0; // Set to 0 to make the arc invisible or change to > 0 to show it
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Helper function to draw image with fallback error logging
    const drawIcon = (src, x, y) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            ctx.drawImage(img, x, y, SVG_SIZE, SVG_SIZE);
        };
        img.onerror = () => {
            console.error(`Failed to load ${src}`);
        };
    };

    // Draw moonrise.svg at left endpoint
    drawIcon('images/moonrise.svg', 20 - SVG_SIZE / 2, centerY - SVG_SIZE / 2);

    // Draw moonset.svg at right endpoint
    drawIcon('images/moonset.svg', canvasWidth - 20 - SVG_SIZE / 2, centerY - SVG_SIZE / 2);

    // Draw phase-specific SVG if visible
    if (moonData.visible && moonData.phaseSvgPath) {
        drawIcon(moonData.phaseSvgPath, moonData.x, moonData.y);
    }
}

/** Main drawing function that recalculates moon position and updates canvas/info panel.
 */
function draw() {
    const canvas = document.getElementById('moonCanvas');
    if (!canvas) {
        console.error("Canvas element not found!");
        return;
    }
    const ctx = canvas.getContext('2d');

    // Define canvas size based on CSS fixed values for stability
    let canvasWidth = 600; 
    let canvasHeight = 450; 
    
    // Setting width/height properties based on your CSS definitions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const moonData = getMoonPosition(canvasWidth, canvasHeight);

    
    // --- START: LOGIC FOR DYNAMIC SKY BACKGROUND (Copied from previous step's working code) ---
    const now = moment().tz(LOCATION.timezone).toDate();
    const sunTimes = SunCalc.getTimes(now, LOCATION.lat, LOCATION.lng);

    const sunriseTime = sunTimes.sunrise; 
    const sunsetTime = sunTimes.sunset;   

    let skyImageSrc = 'images/sky.jpg'; // Default to day sky

    if (now > sunsetTime || now < sunriseTime) {
        skyImageSrc = 'images/nightsky.jpg';
    } 
    // --- END: LOGIC FOR DYNAMIC SKY BACKGROUND ---


    // Load background image
    const img = new Image();
    img.src = skyImageSrc; 
    
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        drawForeground(ctx, canvasWidth, canvasHeight, moonData);
    };
    img.onerror = () => {
        console.error(`Failed to load ${skyImageSrc}, using fallback background`);
        // Add fallback class for CSS background gradient
        canvas.classList.add('fallback'); 
        drawForeground(ctx, canvasWidth, canvasHeight, moonData);
    };
}

// Handle window resize (to maintain responsiveness) and initial draw
window.addEventListener('resize', draw);

// Initial draw when the script loads
draw(); 

// Update the visualization every minute (60,000 milliseconds)
setInterval(draw, 60000);
