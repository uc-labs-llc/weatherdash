<?php
// Set the content type header for JSON response
header('Content-Type: application/json');

// 1. Include the external configuration file
// NOTE: Ensure 'email-config.php' is in the same directory as this file.
require_once 'email-config.php'; 

// --- Configuration ---
// Now using constants defined in email-config.php
// These constants must be defined in your email-config.php file:
$DEFAULT_RECIPIENT = SYSTEM_RECIPIENT_EMAIL; 
$SENDER_EMAIL = SYSTEM_SENDER_EMAIL; 


// --- 1. Read and Decode Incoming JSON Data ---
$input_data = file_get_contents('php://input');
$data = json_decode($input_data, true);

// Check if decoding was successful and required fields exist
if (empty($data) || !isset($data['device']) || !isset($data['status']) || !isset($data['message'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing JSON data in request payload.']);
    exit;
}

// Extract data
$device = htmlspecialchars($data['device']);
$status = htmlspecialchars($data['status']);
$alert_message = htmlspecialchars($data['message']);
$timestamp = date('Y-m-d H:i:s T');


// --- 2. Construct Email Content ---

$to = $DEFAULT_RECIPIENT; // Uses the constant from email-config.php
$subject = "🚨 IoT ALERT: {$device} Status Changed to {$status}";
$title = "Urgent IoT System Alert: {$device}";

// Simple HTML message body construction
$message = '
    <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f0f4f8; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #cc0000; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">' . $title . '</h2>
            
            <p style="font-size: 16px;"><strong>Device:</strong> ' . $device . '</p>
            <p style="font-size: 16px;"><strong>New Status:</strong> <span style="color: #cc0000; font-weight: bold;">' . $status . '</span></p>
            <p style="font-size: 16px;"><strong>Alert Details:</strong> ' . $alert_message . '</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="font-size: 12px; color: #777;">Timestamp: ' . $timestamp . '</p>
            <p style="font-size: 12px; color: #777;">This is an automated alert. Do not reply.</p>
        </div>
    </div>
';

// --- 3. Send Email ---

// Headers for HTML email, using SENDER_EMAIL from email-config.php
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: {$device} <{$SENDER_EMAIL}>" . "\r\n";

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['status' => 'success', 'message' => 'Email alert sent successfully.']);
} else {
    // Note: mail() failure often means a server configuration issue, not a PHP code issue.
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'PHP mail() function failed. Check server mail logs.']);
}
?>
