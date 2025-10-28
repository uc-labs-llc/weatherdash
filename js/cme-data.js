// cme-data.js - CME Data Display Component
class CMEWidget {
    constructor(containerId = 'cme-panel') {
        this.containerId = containerId;
        this.container = null;
        this.data = null;
        this.updateInterval = 300000; // 5 minutes
    }

    // Initialize the widget
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`CME Widget: Container #${this.containerId} not found`);
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
            
            const response = await fetch('js/cme_latest.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data = await response.json();
            this.render();
            
        } catch (error) {
            console.error('CME Widget: Error fetching data:', error);
            this.showError(error.message);
        }
    }

    // Show loading state
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌞</span>
                <h3 class="widget-title">Coronal Mass Ejection</h3>
            </div>
            <div class="widget-content loading">
                <div class="loading-spinner"></div>
                <p>Loading CME data...</p>
            </div>
        `;
    }

    // Render the CME data
    render() {
        if (!this.container || !this.data) return;

        // Check for errors in data
        if (this.data.error || this.data.activity_id === 'N/A') {
            this.renderNoData();
            return;
        }

        const speed = this.data.speed !== 'N/A' ? `${this.data.speed} km/s` : 'Unknown';
        const statusClass = this.getStatusClass(this.data.speed);
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌞</span>
                <h3 class="widget-title">Coronal Mass Ejection</h3>
            </div>
            <div class="widget-content ${statusClass}">
                ${this.renderBasicInfo()}
                ${this.renderDetails()}
                ${this.renderInstruments()}
                ${this.renderFooter()}
            </div>
        `;
    }

    // Render basic CME information
    renderBasicInfo() {
        const startTime = this.formatTime(this.data.start_time);
        
        return `
            <div class="basic-info">
                <div class="data-row">
                    <span class="data-label">Activity ID:</span>
                    <span class="data-value">${this.data.activity_id}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Start Time:</span>
                    <span class="data-value">${startTime}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Speed:</span>
                    <span class="data-value speed-indicator ${this.getSpeedClass(this.data.speed)}">
                        ${this.data.speed !== 'N/A' ? `${this.data.speed} km/s` : 'Unknown'}
                    </span>
                </div>
                <div class="data-row">
                    <span class="data-label">Type:</span>
                    <span class="data-value">${this.data.type !== 'N/A' ? this.data.type : 'Unknown'}</span>
                </div>
            </div>
        `;
    }

    // Render detailed CME information
    renderDetails() {
        const details = [];
        
        if (this.data.source_location !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Source:</span>
                <span class="data-value">${this.data.source_location}</span>
            </div>`);
        }
        
        if (this.data.latitude !== 'N/A' && this.data.longitude !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Location:</span>
                <span class="data-value">${this.data.latitude}°, ${this.data.longitude}°</span>
            </div>`);
        }
        
        if (this.data.half_angle !== 'N/A') {
            details.push(`<div class="data-row">
                <span class="data-label">Half Angle:</span>
                <span class="data-value">${this.data.half_angle}°</span>
            </div>`);
        }

        if (details.length > 0) {
            return `<div class="details-section">${details.join('')}</div>`;
        }
        
        return '';
    }

    // Render instruments information
    renderInstruments() {
        if (!this.data.instruments || this.data.instruments.length === 0) {
            return '';
        }

        const instrumentNames = this.extractInstrumentNames(this.data.instruments);
        if (instrumentNames.length === 0) return '';

        return `
            <div class="instruments-section">
                <div class="data-row">
                    <span class="data-label">Instruments:</span>
                    <span class="data-value">${instrumentNames.join(', ')}</span>
                </div>
            </div>
        `;
    }

    // Render footer with refresh info
    renderFooter() {
        return `
            <div class="widget-footer">
                <span class="last-updated">Updated: ${new Date().toLocaleTimeString()}</span>
                <button class="refresh-btn" onclick="cmeWidget.refresh()">🔄 Refresh</button>
            </div>
        `;
    }

    // Render no data state
    renderNoData() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌞</span>
                <h3 class="widget-title">Coronal Mass Ejection</h3>
            </div>
            <div class="widget-content no-data">
                <div class="basic-info">
                    <div class="data-row">
                        <span class="data-label">Status:</span>
                        <span class="data-value">No recent CME events</span>
                    </div>
                </div>
                <div class="widget-footer">
                    <span class="last-updated">Last check: ${new Date().toLocaleTimeString()}</span>
                    <button class="refresh-btn" onclick="cmeWidget.refresh()">🔄 Refresh</button>
                </div>
            </div>
        `;
    }

    // Show error state
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌞</span>
                <h3 class="widget-title">Coronal Mass Ejection</h3>
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
                    <button class="refresh-btn" onclick="cmeWidget.refresh()">🔄 Retry</button>
                </div>
            </div>
        `;
    }

    // Utility methods
    extractInstrumentNames(instruments) {
        if (!instruments || !Array.isArray(instruments)) return [];
        
        return instruments.map(instrument => {
            if (typeof instrument === 'string') {
                return instrument;
            } else if (instrument && typeof instrument === 'object') {
                return instrument.displayName || instrument.name || 'Unknown Instrument';
            }
            return 'Unknown Instrument';
        });
    }

    formatTime(timeString) {
        if (timeString === 'N/A') return 'Unknown';
        try {
            const date = new Date(timeString);
            return date.toLocaleString();
        } catch (e) {
            return timeString;
        }
    }

    getStatusClass(speed) {
        if (speed === 'N/A') return 'unknown';
        
        const speedValue = parseInt(speed);
        if (speedValue > 1000) return 'high-speed';
        if (speedValue > 500) return 'medium-speed';
        return 'low-speed';
    }

    getSpeedClass(speed) {
        if (speed === 'N/A') return 'speed-unknown';
        
        const speedValue = parseInt(speed);
        if (speedValue > 1000) return 'speed-high';
        if (speedValue > 500) return 'speed-medium';
        return 'speed-low';
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

// Create and initialize the CME widget
const cmeWidget = new CMEWidget('cme-panel');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    cmeWidget.init();
});
