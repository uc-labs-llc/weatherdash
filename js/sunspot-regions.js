// sunspot-regions.js - Sunspot Regions Data Display Component
class SunspotRegionsWidget {
    constructor(containerId = 'sunspot-regions-panel') {
        this.containerId = containerId;
        this.container = null;
        this.data = null;
        this.updateInterval = 300000; // 5 minutes
    }

    // Initialize the widget
    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Sunspot Regions Widget: Container #${this.containerId} not found`);
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
            
            const response = await fetch('js/sunspot_regions_latest.json?t=' + new Date().getTime());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            this.data = await response.json();
            this.render();
            
        } catch (error) {
            console.error('Sunspot Regions Widget: Error fetching data:', error);
            this.showError(error.message);
        }
    }

    // Show loading state
    showLoading() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔍</span>
                <h3 class="widget-title">Sunspot Regions</h3>
            </div>
            <div class="widget-content loading">
                <div class="loading-spinner"></div>
                <p>Loading sunspot data...</p>
            </div>
        `;
    }

    // Render the sunspot regions data
    render() {
        if (!this.container || !this.data) return;

        // Check for errors or no data
        if (this.data.error || !this.data.total_regions || this.data.total_regions === 0) {
            this.renderNoData();
            return;
        }

        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔍</span>
                <h3 class="widget-title">Sunspot Regions</h3>
            </div>
            <div class="widget-content">
                ${this.renderSummary()}
                ${this.renderRegionsList()}
                ${this.renderFooter()}
            </div>
        `;
    }

    // Render summary information
    renderSummary() {
        const totalRegions = this.data.total_regions;
        const largestRegion = this.data.largest_region;
        const mostActiveRegion = this.data.most_active_region;

        return `
            <div class="basic-info">
                <div class="data-row">
                    <span class="data-label">Total Active:</span>
                    <span class="data-value">${totalRegions} regions</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Largest:</span>
                    <span class="data-value">AR ${largestRegion.number}</span>
                </div>
                <div class="data-row">
                    <span class="data-label">Most Active:</span>
                    <span class="data-value">AR ${mostActiveRegion.number}</span>
                </div>
            </div>
        `;
    }

    // Render the list of sunspot regions
    renderRegionsList() {
        if (!this.data.active_regions || this.data.active_regions.length === 0) {
            return '';
        }

        // Take only the first 2-3 regions to fit in compact space
        const displayRegions = this.data.active_regions.slice(0, 2);
        
        const regionsHtml = displayRegions.map(region => `
            <div class="sunspot-region-item">
                <div class="region-header">
                    <span class="region-number">AR ${region.number}</span>
                    <span class="region-status ${region.status.toLowerCase()}">${region.status}</span>
                </div>
                <div class="region-details">
                    <span class="region-location">${region.location}</span>
                    <span class="region-class">${region.classification}</span>
                </div>
                <div class="region-flare">
                    <span class="flare-prob">${region.flare_probability}</span>
                    <span class="last-flare">${region.last_flare}</span>
                </div>
            </div>
        `).join('');

        return `
            <div class="sunspot-regions-list">
                ${regionsHtml}
            </div>
        `;
    }

    // Render footer with refresh info
    renderFooter() {
        const hasMoreRegions = this.data.active_regions && this.data.active_regions.length > 2;
        const moreText = hasMoreRegions ? `+${this.data.active_regions.length - 2} more` : '';
        
        return `
            <div class="widget-footer">
                <span class="last-updated">${moreText}</span>
                <button class="refresh-btn" onclick="sunspotRegionsWidget.refresh()">🔄</button>
            </div>
        `;
    }

    // Render no data state
    renderNoData() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔍</span>
                <h3 class="widget-title">Sunspot Regions</h3>
            </div>
            <div class="widget-content no-data">
                <div class="basic-info">
                    <div class="data-row">
                        <span class="data-label">Status:</span>
                        <span class="data-value">No active regions</span>
                    </div>
                    <div class="data-row">
                        <span class="data-label">Solar Minimum:</span>
                        <span class="data-value">Quiet conditions</span>
                    </div>
                </div>
                <div class="widget-footer">
                    <span class="last-updated">Last check: ${new Date().toLocaleTimeString()}</span>
                    <button class="refresh-btn" onclick="sunspotRegionsWidget.refresh()">🔄</button>
                </div>
            </div>
        `;
    }

    // Show error state
    showError(message) {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="widget-header">
                <span class="widget-icon">🔍</span>
                <h3 class="widget-title">Sunspot Regions</h3>
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
                    <button class="refresh-btn" onclick="sunspotRegionsWidget.refresh()">🔄 Retry</button>
                </div>
            </div>
        `;
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

// Create and initialize the sunspot regions widget
const sunspotRegionsWidget = new SunspotRegionsWidget('sunspot-regions-panel');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    sunspotRegionsWidget.init();
});
