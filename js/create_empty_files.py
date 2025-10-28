# create_empty_files.py
import json

# Create empty JSON files with basic structure
empty_data = {
    'status': 'No data available', 
    'fetch_time': '2024-01-01T00:00:00',
    'note': 'Run fetch_nasa_data.py to populate with real data'
}

files = [
    'solar_flares_latest.json',
    'geomagnetic_storms_latest.json', 
    'solar_wind_latest.json'
]

for file in files:
    with open(file, 'w') as f:
        json.dump(empty_data, f, indent=2)
    print(f"Created {file}")

print("Empty JSON files created. Now run fetch_nasa_data.py to get real data.")
