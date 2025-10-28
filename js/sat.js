let satMap;
let satTleData = [];
let currentMarkers = [];
let currentFilters = {
    group: null,
    search: '',
    countries: [],
    orbits: []
};

$(document).ready(function() {
    // Check if satellite.js loaded properly
    if (typeof satellite === 'undefined') {
        console.error('satellite.js library not loaded. Check CDN or network.');
        showLibraryError();
    } else {
        console.log('satellite.js loaded successfully.');
    }
    
    initMap();
    initTable();
    setupEventListeners();
    fetchAllSatellites();
});

function initMap() {
    satMap = L.map('sat-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(satMap);
}

function initTable() {
    $('#sat-tle-table').DataTable({
        paging: true,
        searching: true,
        ordering: true,
        pageLength: 10,
        responsive: true
    });
}

function showLibraryError() {
    alert('Warning: satellite.js library failed to load. Positions will be approximate using basic calculations only.');
}

function setupEventListeners() {
    // Search functionality
    $('#sat-search-btn').click(() => {
        const query = $('#sat-search-control').val().trim();
        currentFilters.search = query;
        currentFilters.group = null;
        updateActiveFiltersDisplay();
        if (query) {
            fetchSatelliteSearch(query);
        } else {
            fetchAllSatellites();
        }
    });

    $('#sat-search-control').on('keypress', (e) => {
        if (e.which === 13) {
            $('#sat-search-btn').click();
        }
    });

    // Quick filter buttons
    $('.quick-filter').click(function() {
        const group = $(this).data('group');
        $('.quick-filter').removeClass('active');
        $(this).addClass('active');
        
        currentFilters.group = group;
        currentFilters.search = '';
        $('#sat-search-control').val('');
        updateActiveFiltersDisplay();
        
        fetchByGroup(group);
    });

    // Country filter
    $('#country-filter').change(function() {
        currentFilters.countries = Array.from($(this).val() || []);
        updateActiveFiltersDisplay();
        applyClientSideFilters();
    });

    // Orbit filter
    $('#orbit-filter').change(function() {
        currentFilters.orbits = Array.from($(this).val() || []);
        updateActiveFiltersDisplay();
        applyClientSideFilters();
    });

    // Display limit
    $('#sat-display-limit').change(function() {
        updateDisplay();
    });

    // Clear filters
    $('#sat-clear-filters').click(() => {
        clearAllFilters();
    });

    // Map controls
    $('#sat-center-map').click(() => satMap.setView([0, 0], 2));
    $('#sat-center-earth').click(() => satMap.setView([0, 0], 2));
    
    // Sidebar controls
    $('#sat-fetch-btn').click(() => {
        clearAllFilters();
        fetchAllSatellites();
    });
}

// Fetch all active satellites
async function fetchAllSatellites() {
    console.log('Fetching all active satellites from CelesTrak');
    showLoading(true);
    try {
        const response = await fetch('https://celestrak.com/NORAD/elements/gp.php?GROUP=active&FORMAT=tle');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        processTleData(text);
    } catch (error) {
        console.error('Fetch Error:', error);
        alert(`Failed to fetch satellites: ${error.message}`);
        satTleData = [];
        updateDisplay();
    } finally {
        showLoading(false);
    }
}

// Search by name
async function fetchSatelliteSearch(query) {
    console.log(`Searching satellites for "${query}"`);
    showLoading(true);
    try {
        const response = await fetch(`https://celestrak.com/NORAD/elements/gp.php?NAME=${encodeURIComponent(query)}&FORMAT=tle`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();
        processTleData(text);
    } catch (error) {
        console.error('Search Error:', error);
        alert(`Search failed for "${query}": ${error.message}`);
        satTleData = [];
        updateDisplay();
    } finally {
        showLoading(false);
    }
}

// Fetch by group
async function fetchByGroup(group) {
    console.log(`Fetching satellite group: ${group}`);
    showLoading(true);
    try {
        const response = await fetch(`https://celestrak.com/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        processTleData(text);
    } catch (error) {
        console.error('Group fetch error:', error);
        alert(`Failed to fetch ${group} satellites: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

function processTleData(text) {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length < 3) {
        throw new Error('No valid TLE data received');
    }
    
    satTleData = [];
    for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 < lines.length && lines[i + 1].startsWith('1 ') && lines[i + 2].startsWith('2 ')) {
            satTleData.push({
                name: lines[i].trim(),
                norad: lines[i + 1].substring(2, 7).trim(),
                tle1: lines[i + 1].trim(),
                tle2: lines[i + 2].trim()
            });
        }
    }
    
    if (!satTleData.length) {
        throw new Error('No valid TLEs found');
    }
    
    console.log(`Loaded ${satTleData.length} satellites`);
    updateDisplay();
}

// Safe TLE parsing with fallback
function parseTle(tle) {
    // Basic altitude calculation that works without satellite.js
    function calculateBasicAltitude(tle2) {
        try {
            const meanMotion = parseFloat(tle2.substring(52, 63));
            const eccentricity = parseFloat('0.' + tle2.substring(26, 33));
            const semiMajorAxis = Math.pow(398600.4418 / (meanMotion * meanMotion * Math.PI * Math.PI / (86400 * 86400)), 1/3) / 1000;
            const altitude = semiMajorAxis * (1 - eccentricity) - 6378.135;
            return Math.max(0, altitude).toFixed(2);
        } catch (e) {
            return 'N/A';
        }
    }

    try {
        if (typeof satellite === 'undefined') {
            throw new Error('satellite.js not available');
        }

        // Check if satellite functions exist and are callable
        if (typeof satellite.twoline2satrec !== 'function' || 
            typeof satellite.propagate !== 'function' ||
            typeof satellite.gstimeFromDate !== 'function') {
            throw new Error('satellite.js functions not available');
        }

        const satrec = satellite.twoline2satrec(tle.tle1, tle.tle2);
        const date = new Date();
        const positionAndVelocity = satellite.propagate(satrec, date);
        
        if (!positionAndVelocity || !positionAndVelocity.position) {
            throw new Error('No position data');
        }
        
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstimeFromDate(
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds()
        );
        
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const altitude = calculateBasicAltitude(tle.tle2);

        return {
            name: tle.name,
            norad: tle.norad,
            lat: satellite.degreesLat(positionGd.latitude),
            lon: satellite.degreesLong(positionGd.longitude),
            altitude: altitude
        };
    } catch (error) {
        console.warn('Advanced TLE parsing failed for ' + tle.norad + ', using basic data:', error.message);
        
        // Fallback to basic data
        return {
            name: tle.name,
            norad: tle.norad,
            lat: 'N/A',
            lon: 'N/A',
            altitude: calculateBasicAltitude(tle.tle2)
        };
    }
}

function updateDisplay() {
    const table = $('#sat-tle-table').DataTable();
    table.clear();
    
    clearAllMarkers();
    
    const displayLimit = $('#sat-display-limit').val() || 100;
    let displayData = satTleData;
    
    // Apply client-side filters
    if (currentFilters.countries.length > 0 || currentFilters.orbits.length > 0) {
        displayData = applyClientSideFiltersToData(displayData);
    }
    
    if (displayLimit > 0) {
        displayData = displayData.slice(0, displayLimit);
    }

    let validCount = 0;
    let positionCount = 0;
    
    displayData.forEach(tle => {
        const parsed = parseTle(tle);
        if (parsed) {
            table.row.add([
                parsed.name.substring(0, 30) + (parsed.name.length > 30 ? '...' : ''),
                parsed.norad,
                parsed.lat,
                parsed.lon,
                parsed.altitude + ' km'
            ]);
            
            // Only add marker if we have valid numeric coordinates
            if (parsed.lat !== 'N/A' && parsed.lon !== 'N/A' && !isNaN(parseFloat(parsed.lat)) && !isNaN(parseFloat(parsed.lon))) {
                const marker = L.marker([parsed.lat, parsed.lon], { 
                    opacity: 0.7,
                    title: parsed.name
                }).addTo(satMap)
                .bindPopup(`<b>${parsed.name}</b><br>ID: ${parsed.norad}<br>Alt: ${parsed.altitude} km<br>Lat: ${parseFloat(parsed.lat).toFixed(2)}°<br>Lon: ${parseFloat(parsed.lon).toFixed(2)}°`);
                
                currentMarkers.push(marker);
                positionCount++;
            }
            validCount++;
        }
    });
    
    table.draw();
    
    // Update stats display
    $('#sat-stats').html(`
        <strong>Display:</strong> ${validCount} satellites | 
        <strong>Markers:</strong> ${positionCount} | 
        <strong>Total:</strong> ${satTleData.length}
    `);
}

function applyClientSideFilters() {
    updateDisplay();
}

function applyClientSideFiltersToData(data) {
    if (currentFilters.countries.length === 0 && currentFilters.orbits.length === 0) {
        return data;
    }

    return data.filter(sat => {
        const name = sat.name.toLowerCase();
        
        // Country filter
        if (currentFilters.countries.length > 0) {
            const countryMatch = currentFilters.countries.some(country => {
                const patterns = {
                    usa: [/usa/i, /united states/i, /nasa/i, /spacex/i, /starlink/i, /noaa/i, /us/i],
                    russia: [/russia/i, /roscosmos/i, /RS-/i, /russian/i],
                    china: [/china/i, /beidou/i, /chang'e/i, /chinese/i],
                    europe: [/europe/i, /esa/i, /eutelsat/i, /airbus/i, /eumetsat/i],
                    japan: [/japan/i, /jaxa/i, /japanese/i],
                    india: [/india/i, /isro/i, /indian/i],
                    canada: [/canada/i, /csa/i, /canadian/i]
                };
                return patterns[country]?.some(pattern => pattern.test(name));
            });
            if (!countryMatch) return false;
        }

        // Orbit filter
        if (currentFilters.orbits.length > 0) {
            const orbitMatch = currentFilters.orbits.some(orbit => {
                const patterns = {
                    leo: [/iss/i, /starlink/i, /oneweb/i, /iridium/i, /leo/i],
                    geo: [/geo/i, /geostationary/i, /intelsat/i, /ses/i, /geo-/i],
                    meo: [/gps/i, /glonass/i, /galileo/i, /meo/i],
                    heo: [/molniya/i, /tundra/i, /heo/i]
                };
                return patterns[orbit]?.some(pattern => pattern.test(name));
            });
            if (!orbitMatch) return false;
        }

        return true;
    });
}

function clearAllMarkers() {
    currentMarkers.forEach(marker => {
        satMap.removeLayer(marker);
    });
    currentMarkers = [];
}

function clearAllFilters() {
    currentFilters = {
        group: null,
        search: '',
        countries: [],
        orbits: []
    };
    
    $('.quick-filter').removeClass('active');
    $('#country-filter').val([]);
    $('#orbit-filter').val([]);
    $('#sat-search-control').val('');
    $('#sat-display-limit').val('100');
    
    updateActiveFiltersDisplay();
    fetchAllSatellites();
}

function updateActiveFiltersDisplay() {
    const activeFilters = [];
    
    if (currentFilters.group) {
        activeFilters.push(`Group: ${currentFilters.group}`);
    }
    if (currentFilters.search) {
        activeFilters.push(`Search: "${currentFilters.search}"`);
    }
    if (currentFilters.countries.length > 0) {
        activeFilters.push(`Countries: ${currentFilters.countries.join(', ')}`);
    }
    if (currentFilters.orbits.length > 0) {
        activeFilters.push(`Orbits: ${currentFilters.orbits.join(', ')}`);
    }

    $('#active-filters').html(activeFilters.length > 0 
        ? `<strong>Active Filters:</strong> ${activeFilters.join(' | ')}`
        : 'No active filters'
    );
}

function showLoading(show) {
    if (show) {
        $('#loading-spinner').show();
        $('#sat-fetch-btn').prop('disabled', true);
        $('#sat-search-btn').prop('disabled', true);
    } else {
        $('#loading-spinner').hide();
        $('#sat-fetch-btn').prop('disabled', false);
        $('#sat-search-btn').prop('disabled', false);
    }
}
