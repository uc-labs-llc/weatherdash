// Array of possible text values for the "spin" animation
const spinValues = {
    day: ["00", "11", "22", "33", "44", "55", "66", "77", "88", "99", "12", "23", "34", "01"],
    month: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    year: ["2020", "2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029"]
};

// --- Core Slot Machine Logic ---
function startSpin(elementId, duration) {
    const element = document.getElementById(elementId);
    element.classList.add('spinning');

    const spinInterval = setInterval(() => {
        const type = elementId.includes('day') && elementId !== 'dow-segment' ? 'day' :
                     elementId.includes('month') ? 'month' :
                     elementId.includes('year') ? 'year' : 'day';

        const values = spinValues[type] || spinValues.day;
        element.textContent = values[Math.floor(Math.random() * values.length)];
    }, 80);

    setTimeout(() => {
        clearInterval(spinInterval);
        element.classList.remove('spinning');
    }, duration);

    return duration;
}

function updateDigitalReadout() {
    const now = new Date();

    // Calculate the FINAL correct values
    const finalValues = {
        'dow-segment': now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        'day-segment': now.getDate().toString().padStart(2, '0'),
        'month-segment': now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        'year-segment': now.toLocaleDateString('en-US', { year: 'numeric' })
    };

    // Define spin durations for a staggered lock sequence
    const spinDurations = {
        'dow-segment': 1800,
        'day-segment': 1000,
        'month-segment': 1400,
        'year-segment': 1600
    };

    // Function to handle the full spin and lock sequence
    const spinAndLock = (id, delay) => {
        setTimeout(() => {
            const duration = startSpin(id, spinDurations[id]);

            setTimeout(() => {
                document.getElementById(id).textContent = finalValues[id];
            }, duration);

        }, delay);
    };

    // Stagger the start of each element's spin
    spinAndLock('day-segment', 0);
    spinAndLock('month-segment', 300);
    spinAndLock('year-segment', 600);
    spinAndLock('dow-segment', 900);
}

// --- Initial Display (Non-Spinning) ---
function displayInitialDate() {
    const now = new Date();
    document.getElementById('dow-segment').textContent = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    document.getElementById('day-segment').textContent = now.getDate().toString().padStart(2, '0');
    document.getElementById('month-segment').textContent = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    document.getElementById('year-segment').textContent = now.toLocaleDateString('en-US', { year: 'numeric' });
}

// --- Real-Time Sync Logic for Spinning ---
function startRealTimeSync() {
    const now = new Date();
    const seconds = now.getSeconds();
    const millisecondsUntilNextMinute = (60 - seconds) * 1000;

    setTimeout(() => {
        updateDigitalReadout();
        setInterval(updateDigitalReadout, 60000);
    }, millisecondsUntilNextMinute);
}

// Initialize the digital readout
document.addEventListener('DOMContentLoaded', () => {
    displayInitialDate();
    startRealTimeSync();
});
