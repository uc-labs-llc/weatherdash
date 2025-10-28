<?php
// Set headers for JSON response and cross-origin access
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$log_file = 'sprinkler_log.csv';

// --- Function to handle GET request (Read and Aggregate Data) ---
function get_daily_cost($log_file) {
    if (!file_exists($log_file)) {
        // Return empty data if file does not exist
        return ['status' => 'success', 'data' => ['labels' => [], 'data' => []]];
    }

    $daily_costs = [];
    $file_handle = fopen($log_file, 'r');
    
    // Skip the header row
    fgetcsv($file_handle);

    // Read data row by row
    while (($row = fgetcsv($file_handle)) !== FALSE) {
        // Expected CSV structure: Date,Time,TotalGallons,TotalCost,CostPerGallon,FlowRate
        if (count($row) >= 4) {
            $date = $row[0];
            // The cost is the 4th element (index 3)
            $cost = floatval($row[3]); 
            
            // Add the incremental cost to the running daily total for that date
            $daily_costs[$date] = ($daily_costs[$date] ?? 0.0) + $cost;
        }
    }
    
    fclose($file_handle);
    
    // Convert associative array to indexed arrays for Chart.js
    $labels = array_keys($daily_costs);
    $data = array_values($daily_costs);
    
    return [
        'status' => 'success', 
        'data' => [
            'labels' => $labels, 
            'data' => $data
        ]
    ];
}

// --- Function to handle POST request (Log new data) ---
function log_activation_data($log_file) {
    // Check if the request method is POST and content type is JSON
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        return ['status' => 'error', 'message' => 'Method Not Allowed. Only POST is accepted for logging.'];
    }

    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    if (json_last_error() !== JSON_ERROR_NONE || !isset($data['timestamp'])) {
        http_response_code(400);
        return ['status' => 'error', 'message' => 'Invalid JSON input.'];
    }

    try {
        // Extract required fields
        $timestamp = new DateTime($data['timestamp']);
        $date = $timestamp->format('Y-m-d');
        $time = $timestamp->format('H:i:s');
        $gallons = floatval($data['gallons'] ?? 0);
        $cost = floatval($data['cost'] ?? 0);
        $costPerGallon = floatval($data['costPerGallon'] ?? 0);
        $flowRate = floatval($data['flowRate'] ?? 0);

        // Prepare the CSV row
        $log_entry = [
            $date,
            $time,
            number_format($gallons, 2, '.', ''),
            number_format($cost, 3, '.', ''),
            number_format($costPerGallon, 3, '.', ''),
            number_format($flowRate, 0, '.', '')
        ];

        // Check if file exists to decide whether to write header
        $file_exists = file_exists($log_file);
        
        // Open file for appending (a)
        $file_handle = fopen($log_file, 'a');

        if (!$file_handle) {
            http_response_code(500);
            return ['status' => 'error', 'message' => 'Could not open log file for writing. Check permissions (e.g., chmod 777).'];
        }

        // Write header only if the file did not exist before
        if (!$file_exists) {
            fputcsv($file_handle, ['Date', 'Time', 'TotalGallons', 'TotalCost', 'CostPerGallon', 'FlowRate']);
        }

        // Write the data row
        fputcsv($file_handle, $log_entry);
        fclose($file_handle);

        return ['status' => 'success', 'message' => 'Data logged successfully.'];

    } catch (Exception $e) {
        http_response_code(500);
        return ['status' => 'error', 'message' => 'Server exception: ' . $e->getMessage()];
    }
}


// --- ROUTING LOGIC ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $response = get_daily_cost($log_file);
    echo json_encode($response);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = log_activation_data($log_file);
    echo json_encode($response);
} else {
    // Handle preflight OPTIONS request if necessary
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
    } else {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
    }
}

?>
