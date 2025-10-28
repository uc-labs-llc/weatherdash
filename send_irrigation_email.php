<?php
// send_irrigation_email.php

// 1. Include the external configuration file
// NOTE: Ensure 'email-config.php' is in the same directory as this file.
require_once 'email-config.php'; 

// Set the content type header for JSON response
header('Content-Type: application/json');

// --- Configuration (Now reading from email-config.php) ---
// Define the constants SYSTEM_RECIPIENT_EMAIL and SYSTEM_SENDER_EMAIL in email-config.php
$DEFAULT_RECIPIENT = SYSTEM_RECIPIENT_EMAIL; 
$SENDER_EMAIL = SYSTEM_SENDER_EMAIL; 
// -----------------------

// --- Utility function to format the weather report into an HTML list ---
function formatReportHtml($report, $title, $backgroundColor = '#f0f4f8', $alertColor = '#cc0000') {
    $list_items = '';
// ... (rest of the formatReportHtml function remains unchanged)
    $current_time = date('F j, Y, g:i A T');

    // Create an HTML list of metrics
    foreach ($report as $label => $value) {
        if ($value !== '--' && $label !== 'Total Rainfall') {
             // Basic inline styling for a clean look
             $list_items .= '
             <tr>
                 <td style="padding: 8px 15px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">' . htmlspecialchars($label) . '</td>
                 <td style="padding: 8px 15px; border-bottom: 1px solid #e0e0e0; color: #007bff; text-align: right;">' . htmlspecialchars($value) . '</td>
             </tr>';
        }
    }
    
    // Wrap the content in a responsive, modern HTML template with inline CSS
    $html_body = '
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: ' . $backgroundColor . '; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-top: 5px solid ' . $alertColor . ';">
            
            <h2 style="color: ' . $alertColor . '; border-bottom: 2px solid #005a9c; padding-bottom: 10px; margin-top: 0;">
                ' . htmlspecialchars($title) . '
            </h2>
            <p style="font-size: 14px; color: #555;">Report Time: ' . $current_time . '</p>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-collapse: collapse;">
                ' . $list_items . '
            </table>

            <p style="margin-top: 30px; font-size: 12px; color: #888;">
                This alert was sent by the dedicated Sprinkler Control System endpoint.
            </p>
        </div>
    </div>';

    return $html_body;
}

// --- Security Check ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}

// --- Data Processing (No event_type check needed!) ---
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

// Extract required data
$weather_report_data = $data['weather_report'] ?? [];
$rainfall = $data['rainfall'] ?? 'N/A';
$threshold = $data['threshold'] ?? 'N/A';
$to = $data['recipient'] ?? $DEFAULT_RECIPIENT; 

// Prepare Email Components
$subject = "🚨 IRRIGATION ACTIVATION ALERT: Rain Below Threshold!";

// Create a custom title/summary for the activation email
$alert_title = "Sprinkler System Activated: Low Rainfall Detected";
$alert_summary = '<p style="color: #cc0000; font-size: 16px; font-weight: bold; margin-bottom: 20px;">
    Rainfall (' . htmlspecialchars($rainfall) . ' in.) is below the threshold (' . htmlspecialchars($threshold) . ' in.). Irrigation initiated to protect the yard.
</p>
<h3 style="color: #005a9c;">Current Dashboard Metrics:</h3>';

// Generate the HTML message body
$message = formatReportHtml($weather_report_data, $alert_title, '#fff0f0', '#cc0000'); // Light red background for alert
// Inject the alert summary before the table
$message = str_replace('<h2', $alert_summary . '<h2', $message);
    
// Prepare Headers
$headers = "From: Sprinkler System Alert <" . $SENDER_EMAIL . ">\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";


// --- Send Email ---
if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['status' => 'success', 'message' => 'Dedicated Sprinkler Alert sent successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to send dedicated sprinkler email. Check PHP mail configuration.']);
}

?>
