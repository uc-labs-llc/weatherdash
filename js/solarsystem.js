const deg2rad = Math.PI / 180;

function cosd(x) {
    return Math.cos(x * deg2rad);
}

function sind(x) {
    return Math.sin(x * deg2rad);
}

function atand2(y, x) {
    return Math.atan2(y, x) / deg2rad;
}

function rev(angle) {
    return angle - Math.floor(angle / 360) * 360;
}

function solveKepler(M, e) {
    M = rev(M);
    let Mr = M * deg2rad;
    let E = Mr + e * Math.sin(Mr) * (1 + e * Math.cos(Mr));
    if (e > 0.05) {
        let E0 = E;
        let delta = 1;
        let count = 0;
        while (Math.abs(delta) > 1e-6 && count < 100) {
            delta = (E0 - e * Math.sin(E0) - Mr) / (1 - e * Math.cos(E0));
            E0 -= delta;
            count++;
        }
        E = E0;
    }
    return E / deg2rad;
}

function getD() {
    const now = new Date('2025-10-12T23:21:00Z'); // 06:21 PM CDT = 11:21 PM UTC
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const ut = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    let d = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + day - 730530;
    d += ut / 24;
    return d;
}

const planetsData = [
    {name: 'Sun', color: '#FDB813', elements: null},
    {name: 'Mercury', color: '#B7B8B9', elements: d => ({
        N: 48.3313 + 3.24587e-5 * d,
        i: 7.0047 + 5e-8 * d,
        w: 29.1241 + 1.01444e-5 * d,
        a: 0.387098,
        e: 0.205635 + 5.59e-10 * d,
        M: 168.6562 + 4.0923344368 * d
    })},
    {name: 'Venus', color: '#E6C229', elements: d => ({
        N: 76.6799 + 2.4659e-5 * d,
        i: 3.3946 + 2.75e-8 * d,
        w: 54.891 + 1.38374e-5 * d,
        a: 0.72333,
        e: 0.006773 - 1.302e-9 * d,
        M: 48.0052 + 1.6021302244 * d
    })},
    {name: 'Earth', color: '#6B93D6', elements: d => ({
        N: 0,
        i: 0,
        w: 282.9404 + 4.70935e-5 * d,
        a: 1,
        e: 0.016709 - 1.151e-9 * d,
        M: 356.047 + 0.9856002585 * d
    })},
    {name: 'Mars', color: '#C1440E', elements: d => ({
        N: 49.5574 + 2.11081e-5 * d,
        i: 1.8497 - 1.78e-8 * d,
        w: 286.5016 + 2.92961e-5 * d,
        a: 1.523688,
        e: 0.093405 + 2.516e-9 * d,
        M: 18.6021 + 0.5240207766 * d
    })},
    {name: 'Jupiter', color: '#D8CA9D', elements: d => ({
        N: 100.4542 + 2.76854e-5 * d,
        i: 1.303 - 1.557e-7 * d,
        w: 273.8777 + 1.64505e-5 * d,
        a: 5.20256,
        e: 0.048498 + 4.469e-9 * d,
        M: 19.895 + 0.0830853001 * d
    })},
    {name: 'Saturn', color: '#E4CD9E', elements: d => ({
        N: 113.6634 + 2.3898e-5 * d,
        i: 2.4886 - 1.081e-7 * d,
        w: 339.3939 + 2.97661e-5 * d,
        a: 9.55475,
        e: 0.055546 - 9.499e-9 * d,
        M: 316.967 + 0.0334442282 * d
    })},
    {name: 'Uranus', color: '#D1E7E7', elements: d => ({
        N: 74.0005 + 1.3978e-5 * d,
        i: 0.7733 + 1.9e-8 * d,
        w: 96.6612 + 3.0565e-5 * d,
        a: 19.18171 - 1.55e-8 * d,
        e: 0.047318 + 7.45e-9 * d,
        M: 142.5905 + 0.011725806 * d
    })},
    {name: 'Neptune', color: '#5B5DDF', elements: d => ({
        N: 131.7806 + 3.0173e-5 * d,
        i: 1.77 - 2.55e-7 * d,
        w: 272.8461 - 6.027e-6 * d,
        a: 30.05826 + 3.313e-8 * d,
        e: 0.008606 + 2.15e-9 * d,
        M: 260.2471 + 0.005995147 * d
    })}
];

function getHelioPos(d, pd) {
    if (!pd.elements) return { xh: 0, yh: 0, zh: 0, r: 0, lon: 0, lat: 0 };
    const el = pd.elements(d);
    let N = rev(el.N);
    let i = el.i;
    let w = rev(el.w);
    let a = el.a;
    let e = el.e;
    let M = rev(el.M);
    const E = solveKepler(M, e);
    const xv = a * (cosd(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * sind(E);
    const v = rev(atand2(yv, xv));
    let r = Math.sqrt(xv * xv + yv * yv);
    let xh = r * (cosd(N) * cosd(v + w) - sind(N) * sind(v + w) * cosd(i));
    let yh = r * (sind(N) * cosd(v + w) + cosd(N) * sind(v + w) * cosd(i));
    let zh = r * sind(v + w) * sind(i);
    let lon = rev(atand2(yh, xh));
    let lat = atand2(zh, Math.sqrt(xh * xh + yh * yh));
    let dlon = 0;
    let dlat = 0;
    const Mj = planetsData.find(p => p.name === 'Jupiter').elements(d).M;
    const Ms = planetsData.find(p => p.name === 'Saturn').elements(d).M;
    const Mu = planetsData.find(p => p.name === 'Uranus').elements(d).M;
    switch (pd.name) {
        case 'Jupiter':
            dlon = -0.332 * sind(2 * Mj - 5 * Ms - 67.6)
                - 0.056 * sind(2 * Mj - 2 * Ms + 21)
                + 0.042 * sind(3 * Mj - 5 * Ms + 21)
                - 0.036 * sind(Mj - 2 * Ms)
                + 0.022 * cosd(Mj - Ms)
                + 0.023 * sind(2 * Mj - 3 * Ms + 52)
                - 0.016 * sind(Mj - 5 * Ms - 69);
            break;
        case 'Saturn':
            dlon = 0.812 * sind(2 * Mj - 5 * Ms - 67.6)
                - 0.229 * cosd(2 * Mj - 4 * Ms - 2)
                + 0.119 * sind(Mj - 2 * Ms - 3)
                + 0.046 * sind(2 * Mj - 6 * Ms - 69)
                + 0.014 * sind(Mj - 3 * Ms + 32);
            dlat = -0.020 * cosd(2 * Mj - 4 * Ms - 2)
                + 0.018 * sind(2 * Mj - 6 * Ms - 49);
            break;
        case 'Uranus':
            dlon = 0.040 * sind(Ms - 2 * Mu + 6)
                + 0.035 * sind(Ms - 3 * Mu + 33)
                - 0.015 * sind(Mj - Mu + 20);
            break;
    }
    lon = rev(lon + dlon);
    lat += dlat;
    xh = r * cosd(lat) * cosd(lon);
    yh = r * cosd(lat) * sind(lon);
    zh = r * sind(lat);
    return { xh, yh, zh, r, lon, lat };
}

// Canvas setup
const canvas = document.getElementById('solarSystem');
const ctx = canvas.getContext('2d');
const container = document.querySelector('.container');
const size = Math.min(container.offsetWidth, container.offsetHeight);
canvas.width = size;
canvas.height = size;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const baseSize = canvas.width / 400; // Scale relative to original 400px

// Planet radii for display
const planetRadii = {
    'Sun': 5 * baseSize,
    'Mercury': 1.5 * baseSize,
    'Venus': 2.5 * baseSize,
    'Earth': 2.8 * baseSize,
    'Mars': 2.2 * baseSize,
    'Jupiter': 6 * baseSize,
    'Saturn': 5.5 * baseSize,
    'Uranus': 4.2 * baseSize,
    'Neptune': 4 * baseSize
};

// Moon data (scaled)
const moon = {
    radius: 1 * baseSize,
    distance: 8 * baseSize,
    speed: 0.0122716, // Approx. 360° per synodic month (29.53 days)
    color: "#CCCCCC"
};

let moonAngle = 0;

function drawSolarSystem() {
    const d = getD();
    ctx.fillStyle = "#000011";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rotate canvas -180 degrees counterclockwise
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(-180 * Math.PI / 180);
    ctx.translate(-centerX, -centerY);

    // Draw stars
    drawStars();

    // Draw orbits
    drawOrbits(d);

    // Calculate scale
    let maxR = 0;
    planetsData.forEach(pd => {
        if (pd.name === 'Sun') return;
        const pos = getHelioPos(d, pd);
        const dist = Math.sqrt(pos.xh ** 2 + pos.yh ** 2);
        if (dist > maxR) maxR = dist;
    });
    const innerMaxR = 1.6; // Focus on Mars' orbit
    const scale = (Math.min(canvas.width, canvas.height) / 2 - 30 * baseSize) / innerMaxR;

    // Draw planets
    let earthPos = null;
    planetsData.forEach(pd => {
        let pos;
        if (pd.name === 'Sun') {
            pos = { xh: 0, yh: 0 };
        } else {
            pos = getHelioPos(d, pd);
        }
        let displayScale = scale;
        if (['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(pd.name)) {
            displayScale = scale * (innerMaxR / maxR) * 0.7;
        }
        const x = centerX + pos.xh * displayScale;
        const y = centerY - pos.yh * displayScale; // Positive y up
        if (pd.name !== 'Sun') {
            drawOrbitTrail(pd, x, y);
        }
        drawPlanet(pd, x, y);
        if (pd.name === 'Earth') {
            earthPos = { x, y };
        }
    });

    // Draw Moon
    if (earthPos) {
        moonAngle += moon.speed;
        drawMoon(earthPos.x, earthPos.y);
    }

    ctx.restore();
    //requestAnimationFrame(drawSolarSystem);
}

function drawStars() {
    ctx.fillStyle = "white";
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 0.75 * baseSize;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawOrbits(d) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.5 * baseSize;
    planetsData.forEach(pd => {
        if (pd.name === 'Sun') return;
        const pos = getHelioPos(d, pd);
        let displayScale = (Math.min(canvas.width, canvas.height) / 2 - 30 * baseSize) / 1.6;
        if (['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(pd.name)) {
            displayScale *= (1.6 / 30) * 0.7;
        }
        const r = pos.r * displayScale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawOrbitTrail(planet, x, y) {
    ctx.fillStyle = planet.color + "40";
    ctx.beginPath();
    ctx.arc(x, y, planetRadii[planet.name] * 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlanet(planet, x, y) {
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(x, y, planetRadii[planet.name], 0, Math.PI * 2);
    ctx.fill();

    if (planet.name === "Sun") {
        const gradient = ctx.createRadialGradient(x, y, planetRadii[planet.name], x, y, planetRadii[planet.name] * 2);
        gradient.addColorStop(0, planet.color);
        gradient.addColorStop(1, "rgba(253, 184, 19, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, planetRadii[planet.name] * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    if (planet.name === "Saturn") {
        ctx.strokeStyle = "#C4A76A";
        ctx.lineWidth = 1 * baseSize;
        ctx.beginPath();
        ctx.ellipse(x, y, planetRadii[planet.name] * 1.8, planetRadii[planet.name] * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = "white";
    ctx.font = `${5 * baseSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(planet.name, x, y - planetRadii[planet.name] - 4 * baseSize);
}

function drawMoon(earthX, earthY) {
    const moonX = earthX + Math.cos(moonAngle) * moon.distance;
    const moonY = earthY + Math.sin(moonAngle) * moon.distance;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 0.5 * baseSize;
    ctx.beginPath();
    ctx.arc(earthX, earthY, moon.distance, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = moon.color;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moon.radius, 0, Math.PI * 2);
    ctx.fill();
    const gradient = ctx.createRadialGradient(moonX, moonY, moon.radius, moonX, moonY, moon.radius * 2);
    gradient.addColorStop(0, moon.color);
    gradient.addColorStop(1, "rgba(204, 204, 204, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moon.radius * 2, 0, Math.PI * 2);
    ctx.fill();
}

// Start animation
drawSolarSystem();
setInterval(drawSolarSystem, 100);
