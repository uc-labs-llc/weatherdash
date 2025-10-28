import { LOCATION } from './api-key.js'; // Import the location data
const SUN_SIZE = 80; // Size for sun.svg
const SVG_SIZE = 80; // Size for sunrise/sunset SVGs

/**
 * Calculates the current position of the sun relative to the horizon
 * for visualization on the canvas.
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} canvasHeight - The height of the canvas.
 * @returns {object} An object containing sun position (x, y), visibility, and time data.
 */
function getSunPosition(canvasWidth, canvasHeight) {
    if (typeof SunCalc === 'undefined') {
        // This is a safety check assuming SunCalc is loaded via script tag
        throw new Error("SunCalc library failed to load. Please check your internet connection.");
    }
    try {
        const now = moment().tz(LOCATION.timezone);
        const sunTimes = SunCalc.getTimes(now.toDate(), LOCATION.lat, LOCATION.lng);
        const sunPos = SunCalc.getPosition(now.toDate(), LOCATION.lat, LOCATION.lng);

        // Check for edge cases (e.g., polar regions where times might be undefined)
        if (!sunTimes.sunrise || !sunTimes.sunset) {
            return {
                visible: false,
                sunrise: 'N/A',
                sunset: 'N/A',
                current_time: now.format('h:mm A'),
                error: 'Sun times not calculable for this date/location.'
            };
        }

        const sunrise = moment(sunTimes.sunrise).tz(LOCATION.timezone);
        const sunset = moment(sunTimes.sunset).tz(LOCATION.timezone);

        const alt = sunPos.altitude * 180 / Math.PI; // Altitude (degrees)
        const az = sunPos.azimuth * 180 / Math.PI;   // Azimuth (degrees)

        const arcRadius = (canvasWidth - 40) / 2;
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight * 0.7;

        if (alt > 0) {
            // Sun is visible (above horizon)
            const dayLength = (sunset - sunrise) / 1000; // in seconds
            const elapsed = (now - sunrise) / 1000; // in seconds
            const progress = Math.min(1, Math.max(0, elapsed / dayLength));
            const angle = 180 * progress; // Angle from 0 (sunrise) to 180 (sunset)

            const rad = angle * Math.PI / 180;
            
            // Calculate X and Y position on the arc
            let x = centerX - arcRadius * Math.cos(rad) - SUN_SIZE / 2;
            let y = centerY - arcRadius * Math.sin(rad) - SUN_SIZE / 2;
            
            // Apply slight vertical adjustment for a more dramatic visual curve
            y = y - (90 - alt) * 0.6; 

            return {
                x: Math.max(0, Math.min(canvasWidth - SUN_SIZE, x)),
                y: Math.max(0, Math.min(canvasHeight - SUN_SIZE, y)),
                visible: true,
                altitude: Math.round(alt * 10) / 10,
                azimuth: Math.round(az * 10) / 10,
                sunrise: sunrise.format('h:mm A'),
                sunset: sunset.format('h:mm A'),
                current_time: now.format('h:mm A')
            };
        }
        
        // Sun is below horizon
        return {
            visible: false,
            sunrise: sunrise.format('h:mm A'),
            sunset: sunset.format('h:mm A'),
            current_time: now.format('h:mm A'),
            altitude: Math.round(alt * 10) / 10,
            azimuth: Math.round(az * 10) / 10 
        };
    } catch (e) {
        console.error("Sun calculation error:", e.message);
        return {
            visible: false,
            error: `Calculation error: ${e.message}`
        };
    }
}

/**
 * Draws the arc, sunrise/sunset icons, and the current sun position on the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} canvasHeight - The height of the canvas.
 * @param {object} sunData - The data object returned by getSunPosition.
 */
function drawForeground(ctx, canvasWidth, canvasHeight, sunData) {
    // Clear canvas before redrawing
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const arcRadius = (canvasWidth - 40) / 2;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight * 0.7;

    // Draw arc (horizon line/path)
    ctx.beginPath();
    // Start at 180 degrees (left) and end at 360 degrees (right)
    ctx.arc(centerX, centerY, arcRadius, Math.PI, 2 * Math.PI); 
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0;
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

    // Draw sunrise.svg at left endpoint
    drawIcon('images/sunrise.svg', 20 - SVG_SIZE / 2, centerY - SVG_SIZE / 2);

    // Draw sunset.svg at right endpoint
    drawIcon('images/sunset.svg', canvasWidth - 20 - SVG_SIZE / 2, centerY - SVG_SIZE / 2);

    // Draw sun.svg if visible
    if (sunData.visible) {
        drawIcon('images/sun.svg', sunData.x, sunData.y);
    }
}


/**
 * Updates the information panel with current sun and location data.
 * This is designed to work with the HTML structure containing #sun-time-row and #lat-lon-row
 * for side-by-side display.
 * @param {object} sunData - The data object returned by getSunPosition.
 */
function updateInfo(sunData) {
    // Get the main containers
    const infoDiv = document.getElementById('info1');
    const sunTimeRow = document.getElementById('sun-time-row');
    const latLonRow = document.getElementById('lat-lon-row');

    // Ensure elements exist before manipulation
    if (!infoDiv || !sunTimeRow || !latLonRow) {
        console.error("Missing required HTML elements: #info1, #sun-time-row, or #lat-lon-row.");
        return;
    }
    
    // Always display the Location heading and current time
    const locationHeadingHTML = `<h2>${LOCATION.name}, ${LOCATION.state}</h2>`;
    const currentTimeParagraphHTML = `<p><strong>Time:</strong> ${sunData.current_time}</p>`;

    // Update static elements (Assumes h2 and first p are direct children of #info)
    const h2Element = infoDiv.querySelector('h2');
    if (h2Element) h2Element.outerHTML = locationHeadingHTML;

    const pElement = infoDiv.querySelector('p');
    if (pElement) pElement.outerHTML = currentTimeParagraphHTML;

    // Handle error state by displaying error and clearing rows
    if (sunData.error) {
        sunTimeRow.innerHTML = `<span class="sun-detail error" style="width: 100%; text-align: center;">${sunData.error}</span>`;
        latLonRow.innerHTML = `<span class="sun-detail status" style="width: 100%; text-align: center;">Check console for details.</span>`;
        return;
    }

    // Insert Sunrise and Sunset into the horizontal row
    sunTimeRow.innerHTML = `
        <span class="sun-detail"><strong>Sunrise:</strong> ${sunData.sunrise}</span>
        <span class="sun-detail"><strong>Sunset:</strong> ${sunData.sunset}</span>
    `;
    
    // Insert Altitude and Azimuth into the horizontal row
    if (sunData.visible) {
        latLonRow.innerHTML = `
            <span class="sun-detail"><strong>Altitude:</strong> ${sunData.altitude}°</span>
            <span class="sun-detail"><strong>Azimuth:</strong> ${sunData.azimuth}°</span>
        `;
    } else {
        // If sun is below the horizon, show status and Lat/Lon
        latLonRow.innerHTML = `
            <span class="sun-detail status" style="width: 100%; text-align: center;">Sun Status: Below horizon</span>
        `;
    }
}

/**
 * Main drawing function that recalculates sun position and updates canvas/info panel.
 */
function draw() {
    const canvas = document.getElementById('sunCanvas');
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

    const sunData = getSunPosition(canvasWidth, canvasHeight);

    // Always update info panel before drawing, so info is ready on load
    updateInfo(sunData); 

    // Load background image
    const img = new Image();
    img.src = 'images/sky.jpg'; // Placeholder for the sky image
    img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        drawForeground(ctx, canvasWidth, canvasHeight, sunData);
    };
    img.onerror = () => {
        console.error("Failed to load sky.jpg, using fallback background");
        // Add fallback class for CSS background gradient
        canvas.classList.add('fallback'); 
        drawForeground(ctx, canvasWidth, canvasHeight, sunData);
    };
}

// Handle window resize (to maintain responsiveness) and initial draw
window.addEventListener('resize', draw);

// Initial draw when the script loads
draw(); 

// Update the visualization every minute (60,000 milliseconds)
setInterval(draw, 60000);

