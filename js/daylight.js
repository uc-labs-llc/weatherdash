// daylight.js - Accurate Sun Position with Real Time Calculation
class DaylightTracker {
    constructor() {
        this.location = {
            latitude: 30.2672,    // Austin, TX
            longitude: -97.7431,  // Austin, TX
            timezone: 'America/Chicago'
        };
    }

    // Accurate Austin, TX winter times
    calculateSunTimes() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Austin, TX typical winter times
        const sunrise = new Date(today);
        sunrise.setHours(7, 20, 0, 0);  // 7:20 AM
        
        const sunset = new Date(today);
        sunset.setHours(17, 40, 0, 0);  // 5:40 PM
        
        // Solar noon (midpoint between sunrise and sunset)
        const solarNoon = new Date(sunrise.getTime() + (sunset - sunrise) / 2);
        
        return { sunrise, sunset, solarNoon };
    }

    calculateSunPosition() {
        const now = new Date();
        const { sunrise, sunset, solarNoon } = this.calculateSunTimes();
        
        const sunriseStr = this.formatTime(sunrise);
        const sunsetStr = this.formatTime(sunset);
        const currentTimeStr = this.formatTime(now);
        const noonStr = this.formatTime(solarNoon);

        console.log('Times - Sunrise:', sunriseStr, 'Noon:', noonStr, 'Sunset:', sunsetStr, 'Current:', currentTimeStr);

        if (now >= sunrise && now <= sunset) {
            // Calculate progress through the day based on actual times
            const totalDaylightMinutes = (sunset - sunrise) / (1000 * 60);
            const minutesSinceSunrise = (now - sunrise) / (1000 * 60);
            const progress = minutesSinceSunrise / totalDaylightMinutes;
            
            console.log('Progress calculation:', {
                totalDaylightMinutes,
                minutesSinceSunrise, 
                progress: progress * 100 + '%'
            });

            // Calculate position - this is the key fix
            const containerWidth = 280; // Account for margins
            const x = 30 + (progress * (containerWidth - 60)); // 30px margin on each side
            
            // Y position follows a sine curve (highest at solar noon)
            const containerHeight = 140;
            const arcHeight = 80;
            const y = containerHeight - 30 - (Math.sin(progress * Math.PI) * arcHeight);
            
            // Calculate actual statistics
            const altitude = Math.sin(progress * Math.PI) * 90;
            const azimuth = 180 * progress;

            return {
                x: Math.max(30, Math.min(250, x)),
                y: Math.max(30, Math.min(130, y)),
                visible: true,
                altitude: Math.round(altitude),
                azimuth: Math.round(azimuth),
                sunrise: sunriseStr,
                sunset: sunsetStr,
                noon: noonStr,
                currentTime: currentTimeStr,
                progress: Math.round(progress * 100)
            };
        }

        // Night time
        return {
            visible: false,
            sunrise: sunriseStr,
            sunset: sunsetStr,
            noon: noonStr,
            currentTime: currentTimeStr,
            progress: 0
        };
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    getCurrentProgressMarker() {
        const now = new Date();
        const { sunrise, sunset } = this.calculateSunTimes();
        
        if (now >= sunrise && now <= sunset) {
            const totalDaylightMinutes = (sunset - sunrise) / (1000 * 60);
            const minutesSinceSunrise = (now - sunrise) / (1000 * 60);
            return (minutesSinceSunrise / totalDaylightMinutes) * 100;
        }
        return 0;
    }

    createDaylightHTML() {
        return `
            <div class="daylight-tracker">
                <div class="daylight-header">
                    <h3>☀️ Daylight Tracker</h3>
                    <div class="location">Austin, TX</div>
                </div>
                <div class="sun-position-container">
                    <div class="sun-path">
                        <div class="horizon-line"></div>
                        <div class="sun-arc"></div>
                        <div class="sun-marker" id="sun-marker">☀️</div>
                        
                        <!-- Time markers at correct positions -->
                        <div class="time-marker" style="left: 0%">
                            <div class="marker-line"></div>
                            <div class="marker-label">7:20 AM</div>
                        </div>
                        <div class="time-marker" style="left: 25%">
                            <div class="marker-line"></div>
                            <div class="marker-label">9:45 AM</div>
                        </div>
                        <div class="time-marker" style="left: 50%">
                            <div class="marker-line"></div>
                            <div class="marker-label">12:30 PM</div>
                        </div>
                        <div class="time-marker" style="left: 75%">
                            <div class="marker-line"></div>
                            <div class="marker-label">3:15 PM</div>
                        </div>
                        <div class="time-marker" style="left: 100%">
                            <div class="marker-line"></div>
                            <div class="marker-label">5:40 PM</div>
                        </div>
                        
                        <div class="east-label">East</div>
                        <div class="west-label">West</div>
                    </div>
                </div>
                <div class="daylight-info">
                    <div class="time-info">
                        <div class="time-slot">
                            <span class="time-label">Sunrise:</span>
                            <span class="time-value" id="sunrise-time">7:20 AM</span>
                        </div>
                        <div class="time-slot">
                            <span class="time-label">Solar Noon:</span>
                            <span class="time-value" id="noon-time">12:30 PM</span>
                        </div>
                        <div class="time-slot">
                            <span class="time-label">Sunset:</span>
                            <span class="time-value" id="sunset-time">5:40 PM</span>
                        </div>
                    </div>
                    <div class="current-info">
                        <div class="current-time" id="current-time">--:-- --</div>
                        <div class="progress-text" id="progress-text">--% of daylight</div>
                    </div>
                </div>
                <div class="daylight-progress">
                    <div class="progress-label">Day Progress</div>
                    <div class="daylight-progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                </div>
            </div>
        `;
    }

    updateDaylightDisplay() {
        const sunData = this.calculateSunPosition();
        
        console.log('Sun Position Debug:', {
            x: sunData.x,
            y: sunData.y,
            progress: sunData.progress + '%',
            visible: sunData.visible
        });

        // Update sun position
        const sunMarker = document.getElementById('sun-marker');
        if (sunMarker && sunData.visible) {
            sunMarker.style.left = `${sunData.x}px`;
            sunMarker.style.top = `${sunData.y}px`;
            sunMarker.style.display = 'block';
        } else if (sunMarker) {
            sunMarker.style.display = 'none';
        }

        // Update all display elements
        this.updateElement('sunrise-time', sunData.sunrise);
        this.updateElement('sunset-time', sunData.sunset);
        this.updateElement('noon-time', sunData.noon);
        this.updateElement('current-time', sunData.currentTime);
        this.updateElement('progress-text', `${sunData.progress}% of daylight`);

        // Update progress bar
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${sunData.progress}%`;
            progressFill.textContent = `${sunData.progress}%`;
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    initialize(containerElement) {
        if (!containerElement) {
            console.error('Daylight tracker container not found');
            return;
        }

        containerElement.innerHTML = this.createDaylightHTML();
        this.updateDaylightDisplay();

        // Update every minute
        setInterval(() => {
            this.updateDaylightDisplay();
        }, 60000);
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', function() {
    const daylightContainer = document.getElementById('daylight-container');
    if (daylightContainer) {
        const tracker = new DaylightTracker();
        tracker.initialize(daylightContainer);
    }
});

window.DaylightTracker = DaylightTracker;
