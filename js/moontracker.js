import { LOCATION } from './api-key.js';

const MOON_SIZE = 80;
const SVG_SIZE  = 80;

/* ---------- BULLETPROOF MOON PHASE MAPPING (BY ILLUMINATION %) ---------- */
function getMoonPhaseSVG(fraction) {
    const pct = fraction * 100;

    console.log(`Moon Illumination: ${pct.toFixed(2)}% → Phase:`, 
        pct < 5 ? 'New' :
        pct < 30 ? 'Waxing Crescent' :
        pct < 55 ? 'First Quarter' :
        pct < 70 ? 'Waxing Gibbous' :
        pct < 80 ? 'Full' :
        pct < 95 ? 'Waning Gibbous' :
        pct < 98 ? 'Last Quarter' :
        'Waning Crescent'
    );

    if (pct < 5)           return 'new.svg';
    if (pct < 30)          return 'waxing-crescent.svg';
    if (pct < 55)          return 'first-quarter.svg';     // LOCKED: 30-55%
    if (pct < 70)          return 'waxing-gibbous.svg';
    if (pct < 80)          return 'full.svg';              // LOCKED: 70-80%
    if (pct < 95)          return 'waning-gibbous.svg';
    if (pct < 98)          return 'last-quarter.svg';
    return 'waning-crescent.svg';
}

/* ---------- MOON POSITION + PHASE ---------- */
function getMoonPosition(canvasWidth, canvasHeight) {
    if (typeof SunCalc === 'undefined') {
        throw new Error("SunCalc library failed to load.");
    }

    try {
        const now = moment().tz(LOCATION.timezone);
        const moonTimes = SunCalc.getMoonTimes(now.toDate(), LOCATION.lat, LOCATION.lng);
        const moonPos   = SunCalc.getMoonPosition(now.toDate(), LOCATION.lat, LOCATION.lng);
        const illumination = SunCalc.getMoonIllumination(now.toDate());

        const fraction = illumination.fraction;
        const moonSVG = `images/${getMoonPhaseSVG(fraction)}`;

        const hasRise = moonTimes.rise && !isNaN(moonTimes.rise.getTime());
        const hasSet  = moonTimes.set  && !isNaN(moonTimes.set.getTime());

        const alt = moonPos.altitude * 180 / Math.PI;
        const az  = moonPos.azimuth  * 180 / Math.PI;

        const arcRadius = (canvasWidth - 40) / 2;
        const centerX   = canvasWidth / 2;
        const centerY   = canvasHeight * 0.7;

        if (alt > 0) {
            let progress = 0.5;

            if (hasRise && hasSet) {
                const moonrise = moment(moonTimes.rise).tz(LOCATION.timezone);
                const moonset  = moment(moonTimes.set).tz(LOCATION.timezone);
                const dayLength = (moonset - moonrise) / 1000;
                const elapsed   = (now - moonrise) / 1000;
                progress = Math.min(1, Math.max(0, elapsed / dayLength));
            } else {
                const normAz = (az + 180) % 360;
                progress = normAz / 360;
            }

            const angle = 180 * progress;
            const rad   = angle * Math.PI / 180;

            let x = centerX - arcRadius * Math.cos(rad) - MOON_SIZE / 2;
            let y = centerY - arcRadius * Math.sin(rad) - MOON_SIZE / 2;
            y = y - (90 - alt) * 0.6;

            return {
                x: Math.max(0, Math.min(canvasWidth - MOON_SIZE, x)),
                y: Math.max(0, Math.min(canvasHeight - MOON_SIZE, y)),
                visible: true,
                moonSVG
            };
        }

        return { visible: false, moonSVG };

    } catch (e) {
        console.error("Moon calculation error:", e.message);
        return { visible: false, moonSVG: 'images/moon/first-quarter.svg' };
    }
}

/* ---------- DRAW FOREGROUND ---------- */
function drawForeground(ctx, canvasWidth, canvasHeight, moonData) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const arcRadius = (canvasWidth - 40) / 2;
    const centerX   = canvasWidth / 2;
    const centerY   = canvasHeight * 0.7;

    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 3;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur  = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const drawIcon = (src, x, y) => {
        console.log(`Drawing: ${src} at (${x.toFixed(1)}, ${y.toFixed(1)})`);
        const img = new Image();
        img.src = src;
        img.onload  = () => ctx.drawImage(img, x, y, SVG_SIZE, SVG_SIZE);
        img.onerror = () => {
            const emojiMap = {
                'new.svg': 'new moon',
                'waxing-crescent.svg': 'waxing crescent moon',
                'first-quarter.svg': 'first quarter moon',
                'waxing-gibbous.svg': 'waxing gibbous moon',
                'full.svg': 'full moon',
                'waning-gibbous.svg': 'waning gibbous moon',
                'last-quarter.svg': 'last quarter moon',
                'waning-crescent.svg': 'waning crescent moon'
            };
            const emoji = emojiMap[src.split('/').pop()] || 'moon';
            ctx.font = '60px serif';
            ctx.fillText(emoji, x + 10, y + 55);
        };
    };

    drawIcon('images/moonrise.svg', 20 - SVG_SIZE/2, centerY - SVG_SIZE/2);
    drawIcon('images/moonset.svg',  canvasWidth - 20 - SVG_SIZE/2, centerY - SVG_SIZE/2);

    if (moonData.visible) {
        drawIcon(moonData.moonSVG, moonData.x, moonData.y);
    }
}

/* ---------- MAIN DRAW LOOP ---------- */
function draw() {
    const canvas = document.getElementById('moonCanvas');
    if (!canvas) {
        console.error("Canvas #moonCanvas not found!");
        return;
    }

    const ctx = canvas.getContext('2d');
    const canvasWidth  = 600;
    const canvasHeight = 450;
    canvas.width  = canvasWidth;
    canvas.height = canvasHeight;

    const moonData = getMoonPosition(canvasWidth, canvasHeight);

    const bg = new Image();
    bg.src = 'images/sky.jpg';
    bg.onload = () => {
        ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);
        drawForeground(ctx, canvasWidth, canvasHeight, moonData);
    };
    bg.onerror = () => {
        ctx.fillStyle = '#0a1a2e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        drawForeground(ctx, canvasWidth, canvasHeight, moonData);
    };
}

window.addEventListener('resize', draw);
draw();
setInterval(draw, 60_000);
