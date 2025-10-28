// Clock and Day/Night Progress script
// Ensure SunCalc is loaded before this script: <script src="https://cdn.jsdelivr.net/npm/suncalc@1.9.0/suncalc.js"></script>

// Clock update function
setInterval(function () {
    var hours = document.getElementById('hours');
    var minutes = document.getElementById('minutes');
    var seconds = document.getElementById('seconds');
    var ampm = document.getElementById('ampm');
    var hh = document.getElementById('hh');
    var mm = document.getElementById('mm');
    var ss = document.getElementById('ss');
    var dotH = document.querySelector('.h_dot');
    var dotM = document.querySelector('.m_dot');
    var dotS = document.querySelector('.s_dot');

    var h = new Date().getHours();
    var m = new Date().getMinutes();
    var s = new Date().getSeconds();
    var ap = h >= 12 ? 'PM' : 'AM';

    if (h > 12) {
        h = h - 12;
    }

    h = h < 10 ? '0' + h : h;
    m = m < 10 ? '0' + m : m;
    s = s < 10 ? '0' + s : s;

    hours.innerHTML = h + ' Hours';
    minutes.innerHTML = m + ' Minutes';
    seconds.innerHTML = s + ' Seconds';
    ampm.innerHTML = ap;

    hh.style.strokeDashoffset = 220 - (220 * h) / 12;
    mm.style.strokeDashoffset = 220 - (220 * m) / 60;
    ss.style.strokeDashoffset = 220 - (220 * s) / 60;

    dotH.style.transform = 'rotate(' + (h * 30) + 'deg)';
    dotM.style.transform = 'rotate(' + (m * 6) + 'deg)';
    dotS.style.transform = 'rotate(' + (s * 6) + 'deg)';
}, 1000);

// Day/Night Progress script
var CLOCK_LAT = 26.2434; // Los Ebanos, TX latitude
var CLOCK_LNG = -98.5617; // Austin, TX longitude
var progressBar = document.querySelector('.progress-bar');
var nightSegment = document.getElementById('night');
var daySegment = document.getElementById('day');
var nightText = document.getElementById('night-text');
var dayText = document.getElementById('day-text');

function updateProgress() {
    var now = new Date();
    var sunrise = SunCalc.getTimes(now, CLOCK_LAT, CLOCK_LNG).sunrise;
    var sunset = SunCalc.getTimes(now, CLOCK_LAT, CLOCK_LNG).sunset;

    var dayStart = sunrise.getTime();
    var dayEnd = sunset.getTime();
    var current = now.getTime();

    var dayProgress = 0;
    var isDaytime = false;

    if (current >= dayStart && current <= dayEnd) {
        dayProgress = ((current - dayStart) / (dayEnd - dayStart)) * 100;
        isDaytime = true;
    } else {
        var nightStart = dayEnd;
        var nightEnd = dayStart + 24 * 60 * 60 * 1000;
        if (current < dayStart) {
            nightStart = dayStart - 24 * 60 * 60 * 1000;
            nightEnd = dayStart;
        }
        dayProgress = ((current - nightStart) / (nightEnd - nightStart)) * 100;
        isDaytime = false;
    }

    if (isDaytime) {
        nightSegment.style.width = '0%';
        daySegment.style.width = dayProgress + '%';
        nightText.textContent = '0% Night';
        dayText.textContent = Math.round(dayProgress) + '% Day';
    } else {
        nightSegment.style.width = dayProgress + '%';
        daySegment.style.width = '0%';
        nightText.textContent = Math.round(dayProgress) + '% Night';
        dayText.textContent = '0% Day';
    }
}

updateProgress();
setInterval(updateProgress, 60000);
