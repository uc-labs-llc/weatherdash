// NASA Space Weather Dashboard - Updated with color-coded status logic and correct bar ID
class NASASpaceWeather {
    // Path correction: set to 'js/' so it looks in /dash/js/
    static JSON_FILE_PATH = 'js/'; 

    constructor() {
        this.data = {
            kpIndex: 'N/A',
            solarFlareClass: 'None',
            geomagneticStorm: 'Quiet',
            cmeSpeed: 'N/A', 
            cmeHalfAngle: 'N/A', 
            cmeLatitude: 'N/A'
        };
        this.init();
    }

    init() {
        this.fetchSpaceWeather();
        setInterval(() => this.fetchSpaceWeather(), 300000);
    }
    
    /** Helper function to fetch and parse JSON with error handling */
    async fetchJSON(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                console.warn(`File not found or unreachable: ${filename}. Status: ${response.status}`);
                return null; 
            }
            return response.json();
        } catch (error) {
            console.error(`Failed to fetch ${filename}:`, error);
            return null; 
        }
    }

    async fetchSpaceWeather() {
        const statusElement = document.getElementById('update-status');
        if (statusElement) statusElement.textContent = 'Fetching real-time data...';

        // 1. Fetch data from all three JSON files in parallel
        const [cmeData, flareData, stormData] = await Promise.all([
            this.fetchJSON(NASASpaceWeather.JSON_FILE_PATH + 'cme_latest.json'),
            this.fetchJSON(NASASpaceWeather.JSON_FILE_PATH + 'solar_flares_latest.json'),
            this.fetchJSON(NASASpaceWeather.JSON_FILE_PATH + 'geomagnetic_storms_latest.json')
        ]);
        
        // 2. Map and store data
        
        // Standard Mappings
        this.data.solarFlareClass = flareData?.class_type || 'None';
        this.data.kpIndex = stormData?.kp_index !== undefined ? stormData.kp_index : 'N/A';
        this.data.geomagneticStorm = stormData?.storm_level || 'Quiet';
        
        // CME Proxy Mappings (Uses flat, snake_case keys)
        this.data.cmeSpeed = cmeData?.speed || 'N/A';
        this.data.cmeHalfAngle = cmeData?.half_angle || 'N/A';
        this.data.cmeLatitude = cmeData?.latitude || 'N/A';
        
        // 3. Update the HTML elements (Metrics)

        document.getElementById('solar-flare-class').textContent = this.data.solarFlareClass;
        document.getElementById('kp-index').textContent = this.data.kpIndex;
        document.getElementById('geomagnetic-storm').textContent = this.data.geomagneticStorm;

        // Proxy 1: CME Speed
        const speed = this.data.cmeSpeed;
        document.getElementById('solar-wind-speed').textContent = speed + (speed !== 'N/A' ? ' km/s' : '');

        // Proxy 2: CME Half Angle
        const halfAngle = this.data.cmeHalfAngle;
        document.getElementById('solar-wind-density').textContent = halfAngle + (halfAngle !== 'N/A' ? ' deg' : '');
        
        // Proxy 3: Aurora Activity replaced with Kp Index (the cause)
        const kp = this.data.kpIndex;
        document.getElementById('aurora-activity').textContent = kp + (kp !== 'N/A' ? ' Kp' : '');

        // Proxy 4: Sunspot Count replaced with CME Latitude
        const latitude = this.data.cmeLatitude;
        document.getElementById('sunspot-count').textContent = latitude + (latitude !== 'N/A' ? ' deg (Lat)' : '');
        
        // 4. Update status colors and bars based on Kp Index
        this.updateStatusColors(kp);
        
        // 5. Update last updated time
        const now = new Date();
        document.getElementById('last-updated').textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        if (statusElement) statusElement.textContent = 'Data loaded successfully.';
        console.log('Space weather data successfully updated with proxy metrics.');
    }
    
    // --- FUNCTION TO MANAGE COLORS AND BAR WIDTH ---
    updateStatusColors(kp) {
        // NOTE: The status dot (span with class 'status-indicator') has no ID in your snippet.
        // For dynamic coloring, we will assume you add ID="status-dot" to it, or you can use 
        // a more complex selector like: document.querySelector('.status-indicator')
        const dotElement = document.getElementById('status-dot'); 
        
        // CRITICAL FIX: Targetting the correct bar ID from your HTML snippet
        const barElement = document.getElementById('aurora-bar-compact'); 
        
        let colorClass = 'status-green'; // Default to green

        try {
            const kpValue = parseFloat(kp);
            if (isNaN(kpValue)) {
                colorClass = 'status-green';
            } else if (kpValue >= 7) {
                colorClass = 'status-red';    // G3 (Strong) and up
            } else if (kpValue >= 5) {
                colorClass = 'status-orange'; // G1 (Minor) and G2 (Moderate)
            } else if (kpValue >= 4) {
                colorClass = 'status-yellow'; // Unsettled
            } else {
                colorClass = 'status-green'; // Quiet
            }

            // 1. Update the status dot color
            if (dotElement) {
                // Remove existing color classes
                dotElement.classList.remove('status-green', 'status-yellow', 'status-orange', 'status-red', 'status-active');
                // Add the determined color class
                dotElement.classList.add(colorClass);
            }
            
            // 2. Update the bar color and width 
            if (barElement) {
                // Set background color based on severity
                barElement.style.backgroundColor = this.getColorCode(colorClass);
                // Set width based on Kp scale (0-9)
                barElement.style.width = Math.min(100, (kpValue / 9) * 100) + '%';
            }
        } catch (e) {
            console.error('Error applying status colors:', e);
        }
    }
    
    // Helper to map class to a specific CSS color code
    getColorCode(colorClass) {
        switch(colorClass) {
            case 'status-red': return '#e74c3c';
            case 'status-orange': return '#f39c12';
            case 'status-yellow': return '#f1c40f';
            case 'status-green': 
            default: return '#2ecc71';
        }
    }
}
// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    new NASASpaceWeather();
});
