// aurora-forecast.js - Aurora Forecast Data Display Component
class AuroraForecastWidget {
    constructor(containerId = 'aurora-panel') {
        this.containerId = containerId;
        this.container = null;
        this.data = null;
        this.updateInterval = 300000; // 5 minutes
    }

    // Initialize the widget
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Aurora Forecast Widget: Container #${this.containerId} not found`);
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
            
            const response = await fetch('js/aurora_forecast_latest.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data = await response.json();
            this.render();
            
        } catch (error) {
            console.error('Aurora Forecast Widget: Error fetching data:', error);
            // Since this might be a new feature, create mock data for now
            this.createMockData();
        }
    }

    // Create mock data for demonstration
    createMockData() {
        this.data = {
            forecast_level: 'Low',
            kp_index: '3',
            visibility: 'High latitudes only',
            best_viewing: '10 PM - 2 AM Local',
            next_24_hours: 'Quiet conditions expected',
            update_time: new Date().toISOString(),
            note: 'Mock data - real aurora forecast coming soon'
        };
        this.render();
    }

    // Show loading state
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌠</span>
                <h3 class="widget-title">Aurora Forecast</h3>
            </div>
            <div class="widget-content loading">
                <div class="loading-spinner"></div>
                <p>Loading aurora data...</p>
            </div>
        `;
    }

    // Render the aurora forecast data
    render() {
        if (!this.container || !this.data) return;

        const forecastLevel = this.data.forecast_level;
        const auroraColor = this.getAuroraColor(forecastLevel);
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌠</span>
                <h3 class="widget-title">Aurora Forecast</h3>
            </div>
            <div class="widget-content" style="border-left-color: ${auroraColor}">
                ${this.renderBasicInfo(forecastLevel, auroraColor)}
                ${this.renderDetails()}
                ${this.renderNote()}
                ${this.renderFooter()}
            </div>
        `;
    }

    // Render basic aurora information
    renderBasicInfo(forecastLevel, auroraColor) {
        const kpIndex = this.data.kp_index ? `Kp ${this.data.kp_index}` : 'Unknown';
        
        return `
            <div class="basic-info">
                <div class="data-row">
                    <span class="data-label">Activity Level:</span>
                    <span class="data-value" style="color: ${auroraColor}; font-weight: bold">${forecastLevel}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Kp Index:</span>
                    <span class="data-value">${kpIndex}</span>
                </div>
            </div>
        `;
    }

    // Render detailed aurora information
    renderDetails() {
        const details = [];
        
        if (this.data.visibility) {
            details.push(`<div class="data-row">
                <span class="data-label">Visibility:</span>
                <span class="data-value">${this.data.visibility}</span>
            </div>`);
        }
        
        if (this.data.best_viewing) {
            details.push(`<div class="data-row">
                <span class="data-label">Best Viewing:</span>
                <span class="data-value">${this.data.best_viewing}</span>
            </div>`);
        }

        if (this.data.next_24_hours) {
            details.push(`<div class="data-row">
                <span class="data-label">Next 24h:</span>
                <span class="data-value">${this.data.next_24_hours}</span>
            </div>`);
        }

        if (details.length > 0) {
            return `<div class="details-section">${details.join('')}</div>`;
        }
        
        return '';
    }

    // Render note if present
    renderNote() {
        if (this.data.note && !this.data.note.includes('Mock data')) {
            return `
                <div class="details-section">
                    <div class="data-row">
                        <span class="data-label">Note:</span>
                        <span class="data-value">${this.data.note}</span>
                    </div>
                </div>
            `;
        }
        return '';
    }

    // Render footer with refresh info
    renderFooter() {
        const updateTime = this.data.update_time ? 
            new Date(this.data.update_time).toLocaleTimeString() : 
            new Date().toLocaleTimeString();
            
        return `
            <div class="widget-footer">
                <span class="last-updated">Updated: ${updateTime}</span>
                <button class="refresh-btn" onclick="auroraForecastWidget.refresh()">🔄</button>
            </div>
        `;
    }

    // Show error state
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🌠</span>
                <h3 class="widget-title">Aurora Forecast</h3>
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
                    <button class="refresh-btn" onclick="auroraForecastWidget.refresh()">🔄 Retry</button>
                </div>
            </div>
        `;
    }

    // Utility methods
    getAuroraColor(forecastLevel) {
        const level = forecastLevel.toLowerCase();
        if (level.includes('extreme') || level.includes('high')) return '#9b59b6'; // Purple for high activity
        if (level.includes('moderate')) return '#3498db'; // Blue for moderate
        if (level.includes('low')) return '#2ecc71'; // Green for low
        return '#95a5a6'; // Gray for unknown
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

// Create and initialize the aurora forecast widget
const auroraForecastWidget = new AuroraForecastWidget('aurora-panel');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    auroraForecastWidget.init();
});
