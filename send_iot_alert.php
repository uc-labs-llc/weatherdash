<?php
header('Content-Type: application/json');

// 1. Include the external configuration file
// NOTE: Ensure 'email-config.php' is in the same directory as this file.
require_once 'email-config.php'; 

// --- CONFIGURATION ---
// Now using constants defined in email-config.php
$recipient_email = SYSTEM_RECIPIENT_EMAIL; 
$sender_email    = SYSTEM_SENDER_EMAIL; 
// -----------------------

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
    exit;
}

// Get the JSON data sent from the JavaScript fetch request
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($data['device']) || empty($data['status']) || empty($data['message'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing required data fields (device, status, message).']);
    exit;
}

$device = htmlspecialchars($data['device']);
$status = htmlspecialchars($data['status']);
$alert_message = htmlspecialchars($data['message']);

// --- BUILD THE EMAIL ---
$subject = "[CRITICAL ALERT] {$device} Status: {$status}";
$body    = "Dear System Monitor,\n\n";
$body   .= "A critical status change has occurred in the IoT testing environment:\n\n";
$body   .= "Device: {$device}\n";
$body   .= "New Status: {$status}\n";
$body   .= "Reason: {$alert_message}\n";
$body   .= "Timestamp: " . date('Y-m-d H:i:s') . "\n\n";
$body   .= "Please check the Los Ebanos Dashboard for details.";

$headers = "From: {$sender_email}" . "\r\n" .
           "Reply-To: {$sender_email}" . "\r\n" .
           "X-Mailer: PHP/" . phpversion();

// Attempt to send the email
if (mail($recipient_email, $subject, $body, $headers)) {
    echo json_encode(['status' => 'success', 'message' => "Email sent successfully to {$recipient_email}.", 'device' => $device]);
} else {
    // Note: Mail errors are often suppressed by the PHP server configuration
    echo json_encode(['status' => 'error', 'message' => 'Failed to send email via PHP mail() function.', 'device' => $device]);
}

?>
