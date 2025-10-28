// solar-flares.js - Solar Flare Data Display Component
class SolarFlaresWidget {
    constructor(containerId = 'solar-flares-panel') {
        this.containerId = containerId;
        this.container = null;
        this.data = null;
        this.updateInterval = 300000; // 5 minutes
    }

    // Initialize the widget
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Solar Flares Widget: Container #${this.containerId} not found`);
            return false;
        }
        
        this.fetchData();
        this.startAutoRefresh();
        return true;
    }

    // Fetch data from JSON file
    async fetchData() {
        try {
            this.showLoading();
            
            const response = await fetch('js/solar_flares_latest.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data = await response.json();
            this.render();
            
        } catch (error) {
            console.error('Solar Flares Widget: Error fetching data:', error);
            this.showError(error.message);
        }
    }

    // Show loading state
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔥</span>
                <h3 class="widget-title">Solar Flares</h3>
            </div>
            <div class="widget-content loading">
                <div class="loading-spinner"></div>
                <p>Loading flare data...</p>
            </div>
        `;
    }

    // Render the solar flare data
    render() {
        if (!this.container || !this.data) return;

        // Check for errors or no data
        if (this.data.error || this.data.class_type === 'N/A') {
            this.renderNoData();
            return;
        }

        const flareClass = this.data.class_type;
        const flareColor = this.getFlareColor(flareClass);
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔥</span>
                <h3 class="widget-title">Solar Flare</h3>
            </div>
            <div class="widget-content" style="border-left-color: ${flareColor}">
                ${this.renderBasicInfo(flareClass, flareColor)}
                ${this.renderDetails()}
                ${this.renderFooter()}
            </div>
        `;
    }

    // Render basic flare information
    renderBasicInfo(flareClass, flareColor) {
        const peakTime = this.formatTime(this.data.peak_time);
        const startTime = this.formatTime(this.data.start_time);
        
        return `
            <div class="basic-info">
                <div class="data-row">
                    <span class="data-label">Class:</span>
                    <span class="data-value" style="color: ${flareColor}; font-weight: bold">${flareClass}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Peak Time:</span>
                    <span class="data-value">${peakTime}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Start Time:</span>
                    <span class="data-value">${startTime}</span>
                </div>
            </div>
        `;
    }

    // Render detailed flare information
    renderDetails() {
        const details = [];
        
        if (this.data.source_location !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Location:</span>
                <span class="data-value">${this.data.source_location}</span>
            </div>`);
        }
        
        if (this.data.active_region !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Active Region:</span>
                <span class="data-value">${this.data.active_region}</span>
            </div>`);
        }

        if (details.length > 0) {
            return `<div class="details-section">${details.join('')}</div>`;
        }
        
        return '';
    }

    // Render footer with refresh info
    renderFooter() {
        return `
            <div class="widget-footer">
                <span class="last-updated">Updated: ${new Date().toLocaleTimeString()}</span>
                <button class="refresh-btn" onclick="solarFlaresWidget.refresh()">🔄</button>
            </div>
        `;
    }

    // Render no data state
    renderNoData() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔥</span>
                <h3 class="widget-title">Solar Flares</h3>
            </div>
            <div class="widget-content no-data">
                <div class="basic-info">
                    <div class="data-row">
                        <span class="data-label">Status:</span>
                        <span class="data-value">No recent flares</span>
                    </div>
                </div>
                <div class="widget-footer">
                    <span class="last-updated">Last check: ${new Date().toLocaleTimeString()}</span>
                    <button class="refresh-btn" onclick="solarFlaresWidget.refresh()">🔄</button>
                </div>
            </div>
        `;
    }

    // Show error state
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔥</span>
                <h3 class="widget-title">Solar Flares</h3>
            </div>
            <div class="widget-content error">
                <div class="basic-info">
                    <div class="data-row">
                        <span class="data-label">Status:</span>
                        <span class="data-value">⚠️ Data Unavailable</span>
                    </div>
                    <div class="data-row">
                        <span class="error-message">${message}</span>
                    </div>
                </div>
                <div class="widget-footer">
                    <button class="refresh-btn" onclick="solarFlaresWidget.refresh()">🔄 Retry</button>
                </div>
            </div>
        `;
    }

    // Utility methods
    formatTime(timeString) {
        if (timeString === 'N/A') return 'Unknown';
        try {
            const date = new Date(timeString);
            return date.toLocaleTimeString();
        } catch (e) {
            return timeString;
        }
    }

    getFlareColor(flareClass) {
        if (flareClass.startsWith('X')) return '#e74c3c'; // Red for X-class
        if (flareClass.startsWith('M')) return '#e67e22'; // Orange for M-class
        if (flareClass.startsWith('C')) return '#f1c40f'; // Yellow for C-class
        if (flareClass.startsWith('B')) return '#3498db'; // Blue for B-class
        return '#95a5a6'; // Gray for A-class/unknown
    }

    // Public methods
    refresh() {
        this.fetchData();
    }

    startAutoRefresh() {
        setInterval(() => this.fetchData(), this.updateInterval);
    }

    // Get current data (for other components if needed)
    getData() {
        return this.data;
    }
}

// Create and initialize the solar flares widget
const solarFlaresWidget = new SolarFlaresWidget('solar-flares-panel');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    solarFlaresWidget.init();
});
