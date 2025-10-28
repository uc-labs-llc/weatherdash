// geomagnetic-storms.js - Geomagnetic Storm Data Display Component
class GeomagneticStormsWidget {
    constructor(containerId = 'geomagnetic-storms-panel') {
        this.containerId = containerId;
        this.container = null;
        this.data = null;
        this.updateInterval = 300000; // 5 minutes
    }

    // Initialize the widget
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Geomagnetic Storms Widget: Container #${this.containerId} not found`);
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
            
            const response = await fetch('js/geomagnetic_storms_latest.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data = await response.json();
            this.render();
            
        } catch (error) {
            console.error('Geomagnetic Storms Widget: Error fetching data:', error);
            this.showError(error.message);
        }
    }

    // Show loading state
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌌</span>
                <h3 class="widget-title">Geomagnetic Storms</h3>
            </div>
            <div class="widget-content loading">
                <div class="loading-spinner"></div>
                <p>Loading storm data...</p>
            </div>
        `;
    }

    // Render the geomagnetic storm data
    render() {
        if (!this.container || !this.data) return;

        // Check for errors or no data
        if (this.data.error || this.data.storm_level === 'None') {
            this.renderNoData();
            return;
        }

        const stormLevel = this.data.storm_level;
        const stormColor = this.getStormColor(stormLevel);
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌌</span>
                <h3 class="widget-title">Geomagnetic Storm</h3>
            </div>
            <div class="widget-content" style="border-left-color: ${stormColor}">
                ${this.renderBasicInfo(stormLevel, stormColor)}
                ${this.renderDetails()}
                ${this.renderFooter()}
            </div>
        `;
    }

    // Render basic storm information
    renderBasicInfo(stormLevel, stormColor) {
        const kpIndex = this.data.kp_index !== 'N/A' ? `Kp ${this.data.kp_index}` : 'Unknown';
        
        return `
            <div class="basic-info">
                <div class="data-row">
                    <span class="data-label">Level:</span>
                    <span class="data-value" style="color: ${stormColor}; font-weight: bold">${stormLevel}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Kp Index:</span>
                    <span class="data-value">${kpIndex}</span>
                </div>
            </div>
        `;
    }

    // Render detailed storm information
    renderDetails() {
        const details = [];
        
        if (this.data.start_time !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Start Time:</span>
                <span class="data-value">${this.formatTime(this.data.start_time)}</span>
            </div>`);
        }

        if (this.data.causes && this.data.causes.length > 0) {
            const causeText = this.data.causes.join(', ');
            if (causeText.length > 0) {
                details.push(`<div class="data-row">
                    <span class="data-label">Causes:</span>
                    <span class="data-value">${causeText}</span>
                </div>`);
            }
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
                <button class="refresh-btn" onclick="geomagneticStormsWidget.refresh()">🔄</button>
            </div>
        `;
    }

    // Render no data state
    renderNoData() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌌</span>
                <h3 class="widget-title">Geomagnetic Storms</h3>
            </div>
            <div class="widget-content no-data">
                <div class="basic-info">
                    <div class="data-row">
                        <span class="data-label">Status:</span>
                        <span class="data-value">Quiet conditions</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Kp Index:</span>
                        <span class="data-value">Low</span>
                    </div>
                </div>
                <div class="widget-footer">
                    <span class="last-updated">Last check: ${new Date().toLocaleTimeString()}</span>
                    <button class="refresh-btn" onclick="geomagneticStormsWidget.refresh()">🔄</button>
                </div>
            </div>
        `;
    }

    // Show error state
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌌</span>
                <h3 class="widget-title">Geomagnetic Storms</h3>
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
                    <button class="refresh-btn" onclick="geomagneticStormsWidget.refresh()">🔄 Retry</button>
                </div>
            </div>
        `;
    }

    // Utility methods
    formatTime(timeString) {
        if (timeString === 'N/A') return 'Unknown';
        try {
            const date = new Date(timeString);
            return date.toLocaleString();
        } catch (e) {
            return timeString;
        }
    }

    getStormColor(stormLevel) {
        if (stormLevel.includes('G5')) return '#e74c3c'; // Red for Extreme
        if (stormLevel.includes('G4')) return '#e67e22'; // Orange for Severe
        if (stormLevel.includes('G3')) return '#f1c40f'; // Yellow for Strong
        if (stormLevel.includes('G2')) return '#3498db'; // Blue for Moderate
        if (stormLevel.includes('G1')) return '#2ecc71'; // Green for Minor
        return '#95a5a6'; // Gray for none
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

// Create and initialize the geomagnetic storms widget
const geomagneticStormsWidget = new GeomagneticStormsWidget('geomagnetic-storms-panel');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    geomagneticStormsWidget.init();
});
