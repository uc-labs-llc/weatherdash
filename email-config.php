<?php
// email-config.php
// --- System Email Configuration (For PHP scripts like send_sprinkler_email.php) ---
// NOTE: These values must be maintained separately from api-key.js for security and server access.

// The recipient address should match the EMAIL_RECIPIENT constant in api-key.js
define('SYSTEM_RECIPIENT_EMAIL', 'your email address');

// The sender address should match the SENDER_EMAIL constant in api-key.js
define('SYSTEM_SENDER_EMAIL', 'alert_system@yourdashboard.com');

// Add other PHP-specific constants here if needed
// define('LOG_FILE_PATH', '/var/log/sprinkler/log.txt'); 

?>
