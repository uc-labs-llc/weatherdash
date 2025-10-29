<?php
// Define the path to your configuration file
$configFile = 'js/api-key.js'; 
$message = '';
$error = false;

// =========================================================================
// --- UTILITY FUNCTIONS (ESSENTIAL FOR READING/WRITING) ---
// =========================================================================

/**
 * Reads the content of the JS config file and parses constants into a PHP array.
 * @param string $filePath The path to the JavaScript file.
 * @return array The configuration array or an array containing an 'error' key.
 */
function parseConfig($filePath) {
    $config = [];
    if (!file_exists($filePath)) {
        return ['error' => 'Configuration file not found at: ' . htmlspecialchars($filePath)];
    }

    $content = file_get_contents($filePath);
    // Regex to find 'export const KEY = VALUE;' (handles string values '' or numeric values)
    $pattern = '/export const\s+([A-Z_]+)\s*=\s*(?:[\'"](.*?)[\'"]|([0-9\.-]+));/m';

    if (preg_match_all($pattern, $content, $matches, PREG_SET_ORDER)) {
        foreach ($matches as $match) {
            $key = $match[1];
            // Prefer the string match (Group 2), otherwise use the number match (Group 3)
            // This ensures both LAT (26.24) and LON (-98.56) are captured.
            $value = isset($match[2]) && $match[2] !== '' ? $match[2] : $match[3];
            $config[$key] = $value;
        }
    }
    return $config;
}

/**
 * Updates an existing key's value in the JS config file using regex replacement.
 * @param string $filePath The path to the JavaScript file.
 * @param array $updates An associative array of ['KEY' => 'newValue'].
 * @return bool True on success, False on failure.
 */
function rewriteConfig($filePath, $updates) {
    // Read the current file content
    $content = file_get_contents($filePath);
    if ($content === false) {
        return false;
    }

    $newContent = $content;

    // Replace each key's value in the file content
    foreach ($updates as $key => $newValue) {
        $newValue = trim($newValue);
        
        // Determine if the value should be written as a number or a string
        if (is_numeric($newValue) && strpos($newValue, "'") === false && strpos($newValue, '"') === false) {
             $replacement = '$1 = ' . $newValue . ';'; // Number replacement
        } else {
             $safeNewValue = str_replace("'", "\'", $newValue);
             $replacement = '$1 = \'' . $safeNewValue . '\';'; // String replacement with quotes
        }

        $pattern = '/(export const\s+' . preg_quote($key) . '\s*)=\s*.*?(\r?\n|;)/m';
        $newContent = preg_replace($pattern, $replacement . '$2', $newContent);
    }
    
    if (file_put_contents($filePath, $newContent) !== false) {
        return true;
    } else {
        return false;
    }
}


// =========================================================================
// --- EXECUTION LOGIC ---
// =========================================================================

// --- 1. Handle All Form Submissions (Add, Edit, Delete) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    
    // Handle Delete Action
    if ($_POST['action'] === 'delete' && isset($_POST['key_to_delete'])) {
        $keyToDelete = strtoupper(trim($_POST['key_to_delete']));

        // Delete is disabled for safety, but we process the intent
        $message = "WARNING: Delete is disabled for safety. Please manually delete **{$keyToDelete}** from the file `{$configFile}`.";
        $error = true;
    }
    
    // Handle Edit/Add Action
    elseif ($_POST['action'] === 'save' && isset($_POST['config_key']) && isset($_POST['config_value'])) {
        $key = strtoupper(trim($_POST['config_key'])); 
        $value = trim($_POST['config_value']);
        
        $currentConfigList = parseConfig($configFile);
        
        // When editing an EXISTING key
        if (array_key_exists($key, $currentConfigList)) {
            if (rewriteConfig($configFile, [$key => $value])) {
                 $message = "Key **{$key}** updated successfully!";
            } else {
                 $message = 'ERROR: Could not write to file! Check permissions.';
                 $error = true;
            }
        } 
        
        // When adding a NEW key
        elseif ($_POST['is_new'] === 'true') {
            // New variable should be written as a string by default for safety
            $safeValue = str_replace("'", "\'", $value);
            $new_line = "\nexport const {$key} = '{$safeValue}';\n";
            if (file_put_contents($configFile, $new_line, FILE_APPEND | LOCK_EX) !== false) {
                 $message = "New key **{$key}** added successfully!";
            } else {
                 $message = 'ERROR: Could not add new key. Check permissions.';
                 $error = true;
            }
        }
    }
}

// --- 2. Get Current Config for Display ---
$currentConfig = parseConfig($configFile); 

if (isset($currentConfig['error'])) {
    $message = $currentConfig['error'];
    $error = true;
    $currentConfig = [];
}

// --- 3. HTML Output ---
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>System Settings</title>
    <link rel="stylesheet" href="css/settings.css">
</head>
<body>
    <div class="container">
        <h1>⚙️ System Settings Management</h1>
        <hr/>
        
        <?php if ($message): ?>
            <div class="message <?php echo $error ? 'error' : 'success'; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <button id="add-new-btn" type="button" style="margin-bottom: 20px;">
            ➕ Add New Configuration Key
        </button>
        
        <h2>Configuration Variables</h2>
        <table>
            <thead>
                <tr>
                    <th>Variable Name</th>
                    <th>Current Value</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                // --- THIS LOOP ensures ALL keys, including LON, are displayed ---
                foreach ($currentConfig as $key => $value): 
                ?>
                <tr>
                    <td>**<?php echo htmlspecialchars($key); ?>**</td>
                    
                    <td><code><?php echo htmlspecialchars($value); ?></code></td>

                    <td>
                        <a href="#" class="edit-btn" 
                           data-key="<?php echo htmlspecialchars($key); ?>"
                           data-value="<?php echo htmlspecialchars($value); ?>">Edit</a>
                        
                        <a href="#" class="delete-btn" 
                           data-key="<?php echo htmlspecialchars($key); ?>">Delete</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <div id="edit-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2><span id="modal-title">Edit Key</span></h2>
            
            <form method="POST" id="edit-form">
                <input type="hidden" name="action" value="save">
                <input type="hidden" name="is_new" id="is-new" value="false">

                <div class="form-group">
                    <label for="config-key-input">Variable Name (must be all caps, A-Z_)</label>
                    <input type="text" id="config-key-input" name="config_key" readonly required style="text-transform: uppercase;">
                </div>
                
                <div class="form-group">
                    <label for="config-value-input">Value</label>
                    <input type="text" id="config-value-input" name="config_value" required>
                </div>

                <button type="submit">Save Configuration</button>
            </form>
        </div>
    </div>

    <script>
        const modal = document.getElementById('edit-modal');
        const closeBtn = modal.querySelector('.close');
        const form = document.getElementById('edit-form');
        const keyInput = document.getElementById('config-key-input');
        const valueInput = document.getElementById('config-value-input');
        const title = document.getElementById('modal-title');
        const isNewInput = document.getElementById('is-new');

        // Function to open the modal for editing
        function openEditModal(key, value) {
            title.textContent = 'Edit Key: ' + key;
            keyInput.value = key;
            keyInput.readOnly = true; 
            valueInput.value = value;
            isNewInput.value = 'false';
            modal.style.display = 'block';
        }

        // Function to open the modal for adding new key
        document.getElementById('add-new-btn').onclick = function() {
            title.textContent = 'Add New Key';
            keyInput.value = '';
            keyInput.readOnly = false; 
            valueInput.value = '';
            isNewInput.value = 'true';
            modal.style.display = 'block';
            keyInput.focus();
        }

        // Event listeners for all 'Edit' buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const key = this.getAttribute('data-key');
                const value = this.getAttribute('data-value');
                openEditModal(key, value);
            });
        });

        // Event listeners for all 'Delete' buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const keyToDelete = this.getAttribute('data-key');
                
                if (confirm(`WARNING: Delete functionality is highly unstable for direct JS file editing. Are you sure you want to attempt to delete ${keyToDelete}?`)) {
                    
                    // Dynamically create a temporary form and submit the delete action
                    const tempForm = document.createElement('form');
                    tempForm.method = 'POST';
                    tempForm.style.display = 'none'; // Keep it hidden
                    
                    const actionInput = document.createElement('input');
                    actionInput.type = 'hidden';
                    actionInput.name = 'action';
                    actionInput.value = 'delete';
                    tempForm.appendChild(actionInput);
                    
                    const keyInput = document.createElement('input');
                    keyInput.type = 'hidden';
                    keyInput.name = 'key_to_delete';
                    keyInput.value = keyToDelete;
                    tempForm.appendChild(keyInput);
                    
                    document.body.appendChild(tempForm);
                    tempForm.submit();
                }
            });
        });

        // Close modal when 'x' is clicked
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        }

        // Close modal when user clicks outside of it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    </script>
</body>
</html>
