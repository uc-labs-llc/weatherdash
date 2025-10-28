function updateClock() {
  // get time indicator elements
  let hours = document.getElementById('hours');
  let minutes = document.getElementById('minutes');
  let secondes = document.getElementById('seconds');
  let ampm = document.getElementById('ampm');

  // NEW: Get progress bar elements
  let progressBar = document.getElementById('daylight-progress-bar');
  let percentageText = document.getElementById('daylight-percentage');
  
  // digits time indicator
  let hh = document.getElementById('hh');
  let mm = document.getElementById('mm');
  let ss = document.getElementById('ss');


  // dot time indicator
  let dotH = document.querySelector('.h_dot');
  let dotM = document.querySelector('.m_dot');
  let dotS = document.querySelector('.s_dot');

  // get current time
  let date = new Date();
  let h24 = date.getHours(); // 24-hour format (0-23) used for calculations
  let m = date.getMinutes();
  let s = date.getSeconds();
  let ap = h24 >= 12 ? 'PM' : 'AM';

  // --- DAYLIGHT PERCENTAGE CALCULATION & BAR UPDATE ---
  
  // Calculate total seconds elapsed since midnight
  const totalSecondsElapsed = (h24 * 3600) + (m * 60) + s;
  const totalSecondsInDay = 86400; // 24 hours * 60 minutes * 60 seconds
  
  // Calculate percentage, rounded to 1 decimal place
  let percentage = (totalSecondsElapsed / totalSecondsInDay) * 100;
  let formattedPercentage = percentage.toFixed(1);

  if (progressBar && percentageText) { 
      progressBar.style.width = formattedPercentage + '%';
      
      let barColor = '';
      
      // --- NEW DARK THEME COLOR CHOICES ---
      if (percentage < 33.3) {
          barColor = '#D3E9FF'; // Pale Blue/Creme
      } else if (percentage < 66.6) {
          barColor = '#4a90e2'; // Accent Blue
      } else {
          barColor = '#00FFFF'; // Bright Cyan/Aqua (Urgency color)
      }
      
      progressBar.style.backgroundColor = barColor;
      
      // Text color is always white for maximum readability
      percentageText.innerHTML = formattedPercentage + '%';
      percentageText.style.color = '#ffffff'; 
  }

  // --- STANDARD CLOCK DISPLAY LOGIC ---

  // Use a temporary variable for the 12-hour display
  let h_display = h24; 

  // convert to 12 hour format
  if (h_display > 12) {
    h_display = h_display - 12;
  }
  if (h_display === 0) {
    h_display = 12; // 0 (midnight) should display as 12
  }

  // add 0 before single digit
  let h_padded = h_display < 10 ? '0' + h_display : h_display;
  let m_padded = m < 10 ? '0' + m : m;
  let s_padded = s < 10 ? '0' + s : s;

  // set time and label
  hours.innerHTML = h_padded + 'Hours';
  minutes.innerHTML = m_padded + 'Minutes';
  secondes.innerHTML = s_padded + 'Seconds';
  ampm.innerHTML = ap;

  // set time circular indicator
  hh.style.strokeDashoffset = 440 - (440 * (h_display % 12 || 12)) / 12;
  mm.style.strokeDashoffset = 440 - (440 * m) / 60;
  ss.style.strokeDashoffset = 440 - (440 * s) / 60;

  // set dot time position indicator
  dotH.style.transform = `rotate(${h24 * 30}deg)`;
  dotM.style.transform = `rotate(${m * 6}deg)`;
  dotS.style.transform = `rotate(${s * 6}deg)`;
}

// 1. CRITICAL FIX: Call the function immediately to set the clock on load
updateClock(); 

// 2. Then set the interval to update every second
setInterval(updateClock, 1000);
