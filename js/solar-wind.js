// solar-wind.js - Solar Wind Data Display Component
class SolarWindWidget {
    constructor(containerId = 'solar-wind-panel') {
        this.containerId = containerId;
        this.container = null;
        this.data = null;
        this.updateInterval = 300000; // 5 minutes
    }

    // Initialize the widget
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Solar Wind Widget: Container #${this.containerId} not found`);
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
            
            const response = await fetch('js/solar_wind_latest.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data = await response.json();
            this.render();
            
        } catch (error) {
            console.error('Solar Wind Widget: Error fetching data:', error);
            this.showError(error.message);
        }
    }

    // Show loading state
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">💨</span>
                <h3 class="widget-title">Solar Wind</h3>
            </div>
            <div class="widget-content loading">
                <div class="loading-spinner"></div>
                <p>Loading wind data...</p>
            </div>
        `;
    }

    // Render the solar wind data
    render() {
        if (!this.container || !this.data) return;

        // Check for errors or no data
        if (this.data.error || this.data.speed === 'N/A') {
            this.renderNoData();
            return;
        }

        const speed = this.data.speed;
        const windColor = this.getWindColor(speed);
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">💨</span>
                <h3 class="widget-title">Solar Wind</h3>
            </div>
            <div class="widget-content" style="border-left-color: ${windColor}">
                ${this.renderBasicInfo(speed, windColor)}
                ${this.renderDetails()}
                ${this.renderFooter()}
            </div>
        `;
    }

    // Render basic wind information
    renderBasicInfo(speed, windColor) {
        return `
            <div class="basic-info">
                <div class="data-row">
                    <span class="data-label">Speed:</span>
                    <span class="data-value" style="color: ${windColor}; font-weight: bold">${speed} km/s</span>
                </div>
            </div>
        `;
    }

    // Render detailed wind information
    renderDetails() {
        const details = [];
        
        if (this.data.density !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Density:</span>
                <span class="data-value">${this.data.density} p/cm³</span>
            </div>`);
        }
        
        if (this.data.temperature !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Temperature:</span>
                <span class="data-value">${this.formatNumber(this.data.temperature)} K</span>
            </div>`);
        }

        if (this.data.event_time !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Measured:</span>
                <span class="data-value">${this.formatTime(this.data.event_time)}</span>
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
                <button class="refresh-btn" onclick="solarWindWidget.refresh()">🔄</button>
            </div>
        `;
    }

    // Render no data state
    renderNoData() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">💨</span>
                <h3 class="widget-title">Solar Wind</h3>
            </div>
            <div class="widget-content no-data">
                <div class="basic-info">
                    <div class="data-row">
                        <span class="data-label">Status:</span>
                        <span class="data-value">No data available</span>
                    </div>
                </div>
                <div class="widget-footer">
                    <span class="last-updated">Last check: ${new Date().toLocaleTimeString()}</span>
                    <button class="refresh-btn" onclick="solarWindWidget.refresh()">🔄</button>
                </div>
            </div>
        `;
    }

    // Show error state
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">💨</span>
                <h3 class="widget-title">Solar Wind</h3>
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
                    <button class="refresh-btn" onclick="solarWindWidget.refresh()">🔄 Retry</button>
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

    formatNumber(number) {
        if (number === 'N/A') return 'Unknown';
        try {
            return parseInt(number).toLocaleString();
        } catch (e) {
            return number;
        }
    }

    getWindColor(speed) {
        if (speed === 'N/A') return '#95a5a6';
        
        const speedValue = parseInt(speed);
        if (speedValue > 600) return '#e74c3c'; // Red for high speed
        if (speedValue > 400) return '#e67e22'; // Orange for medium-high
        if (speedValue > 300) return '#f1c40f'; // Yellow for medium
        return '#2ecc71'; // Green for normal/low
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

// Create and initialize the solar wind widget
const solarWindWidget = new SolarWindWidget('solar-wind-panel');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    solarWindWidget.init();
});
