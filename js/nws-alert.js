class NWSAlert {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            state: 'TX', // Texas
            refreshInterval: options.refreshInterval || 300000, // 5 minutes
            maxAlerts: options.maxAlerts || 4,
            ...options
        };

        if (!this.container) {
            console.error('NWS Alert: Container element not found');
            return;
        }

        // --- NEW: Setup the central details box container ---
        this.detailsBoxContainer = this.createDetailsBoxContainer();
        document.body.appendChild(this.detailsBoxContainer);
        
        this.displayPlaceholder();
        this.initialize();
    }

    async initialize() {
        await this.fetchAndDisplayAlerts();
        this.setupAutoRefresh();
    }

    // (fetchAndDisplayAlerts, getAlerts, renderAlerts remain the same)
    async fetchAndDisplayAlerts() {
        try {
            this.container.innerHTML = '<div class="nws-alert updating">Fetching weather alerts...</div>';
            const alerts = await this.getAlerts();
            this.renderAlerts(alerts);
        } catch (error) {
            console.error('NWS Alert: Error fetching alerts', error);
            this.displayError('Unable to load weather alerts');
        }
    }

    async getAlerts() {
        const url = `https://api.weather.gov/alerts/active?area=${this.options.state}`;
        
        const response = await fetch(url, {
            headers: {
                // Use a descriptive User-Agent, required by NWS
                'User-Agent': '(your-website.com, contact@email.com)', 
                'Accept': 'application/geo+json'
            }
        });

        if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);
        
        const data = await response.json();
        return data.features || [];
    }

    renderAlerts(alerts) {
        this.container.innerHTML = '';
        const alertsToDisplay = alerts.slice(0, this.options.maxAlerts);

        if (alertsToDisplay.length === 0) {
            this.displayError('No active weather alerts for Texas.');
            return;
        }

        alertsToDisplay.forEach(feature => {
            const properties = feature.properties;
            const alertElement = this.createAlert(
                properties.event, 
                properties.severity, 
                properties.instruction,
                // Pass both full description and areaDesc
                properties.description, 
                properties.expires,
                properties.areaDesc 
            );
            this.container.appendChild(alertElement);
        });
    }

    // --- MODIFIED: Removed the tooltip HTML and added a click event listener ---
    createAlert(event, severity, instruction, description, expires, areaDesc) {
        const TRUNCATION_LIMIT = 105;
        const cssSeverity = severity.toLowerCase();
        const displaySeverity = severity.toUpperCase();
        
        // Truncate the description for the main visible panel
        const truncatedDescription = this.truncateText(description, TRUNCATION_LIMIT);
        
        // Format expiration time
        const timeOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
        let timeString = '';
        if (expires) {
            try {
                const expiresDate = new Date(expires);
                timeString = `Expires: ${expiresDate.toLocaleString('en-US', timeOptions)}`;
            } catch {
                // Handle invalid date string if necessary
            }
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `nws-alert ${cssSeverity} nws-alert-clickable`; // Changed class for styling
        
        alertDiv.innerHTML = `
            <div class="nws-alert-header">
                <div class="nws-alert-title">${event}</div>
                <div class="nws-alert-severity">${displaySeverity}</div>
            </div>
            
            <div class="nws-alert-desc-truncated">${truncatedDescription}</div>

            ${instruction ? `<div class="nws-alert-instructions">${this.truncateText(instruction, TRUNCATION_LIMIT)}</div>` : ''}
            ${timeString ? `<div class="nws-alert-time">${timeString}</div>` : ''}
        `;

        // Store full details for the separate box
        alertDiv.dataset.event = event;
        alertDiv.dataset.areaDesc = areaDesc;
        alertDiv.dataset.fullDescription = description;
        alertDiv.dataset.fullInstruction = instruction;
        alertDiv.dataset.expires = timeString;

        // Add the click handler
        alertDiv.addEventListener('click', () => {
            this.openDetailsBox(alertDiv);
        });

        return alertDiv;
    }

    // --- NEW: Methods for managing the central details box ---

    createDetailsBoxContainer() {
        const container = document.createElement('div');
        container.id = 'nws-details-container';
        container.className = 'nws-details-container'; // Hidden by default via CSS
        container.addEventListener('click', (e) => {
            // Only close if clicking the backdrop, not the box itself
            if (e.target.id === 'nws-details-container' || e.target.classList.contains('nws-details-close-btn')) {
                this.closeDetailsBox();
            }
        });
        return container;
    }

    createDetailsBox(event, areaDesc, description, instruction, expires) {
        // Replace newlines with <br> for proper HTML formatting
        const fullDescriptionHTML = description ? description.replace(/\n/g, '<br>') : 'No details available.';
        const fullInstructionHTML = instruction ? instruction.replace(/\n/g, '<br>') : '';
        
        const detailsBox = document.createElement('div');
        detailsBox.id = 'nws-details-box';
        detailsBox.className = 'nws-details-box';

        detailsBox.innerHTML = `
            <button class="nws-details-close-btn">&times;</button>
            <div class="nws-details-header">
                <div class="nws-details-title">${event} Details</div>
                <div class="nws-details-area">Area: ${areaDesc}</div>
            </div>
            <div class="nws-details-content-scroll">
                <h4>Description:</h4>
                <p>${fullDescriptionHTML}</p>
                ${instruction ? `<h4>Instructions:</h4><p>${fullInstructionHTML}</p>` : ''}
            </div>
            ${expires ? `<div class="nws-details-time">${expires}</div>` : ''}
        `;
        return detailsBox;
    }

    openDetailsBox(alertElement) {
        const { event, areaDesc, fullDescription, fullInstruction, expires } = alertElement.dataset;

        // Clear previous content
        this.detailsBoxContainer.innerHTML = ''; 

        // Create and append the new details box
        const detailsBox = this.createDetailsBox(
            event, 
            areaDesc, 
            fullDescription, 
            fullInstruction, 
            expires
        );
        this.detailsBoxContainer.appendChild(detailsBox);

        // Show the container/backdrop
        this.detailsBoxContainer.classList.add('visible');
    }

    closeDetailsBox() {
        this.detailsBoxContainer.classList.remove('visible');
    }

    // (truncateText, displayPlaceholder, displayError, setupAutoRefresh, refresh remain the same)
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    displayPlaceholder() {
        this.container.innerHTML = `
            <div class="nws-alert-header">
                <h3>Texas Weather Alerts</h3>
            </div>
            <div class="nws-alert advisory">Loading alerts...</div>
        `;
    }
    
    displayError(message) {
        this.container.innerHTML = `
            <div class="nws-alert-header">
                <h3>Texas Weather Alerts</h3>
            </div>
            <div class="nws-alert advisory">${message}</div>
        `;
    }

    setupAutoRefresh() {
        setInterval(() => this.fetchAndDisplayAlerts(), this.options.refreshInterval);
    }

    refresh() {
        this.fetchAndDisplayAlerts();
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // This assumes your container has the ID 'nws-alert-container'
    window.texasAlerts = new NWSAlert('nws-alert-container', {
        maxAlerts: 4
    });
});
