import requests
import json
import os
import sys
from datetime import datetime, timedelta

# --- Configuration (Read API Key from Environment Variable) ---
# It's highly recommended to set this in your crontab, NOT hardcode it here.
# Example: NASA_API_KEY="hrnUD9zbH2JW6vTCKpONEHwtp5qHQXs8LQWFyBHG" /path/to/script.py
#DEFAULT_API_KEY = "Onlnc6AnPAcHOzSvKAfVbtlAYdBVb0R2c78xaTsF" # Fallback if environment is not set
# --- Configuration (Read API Key from Environment Variable) ---
# The script will now rely entirely on the environment variable.
NASA_API_KEY = os.environ.get("NASA_API_KEY")

if not NASA_API_KEY:
    print("Error: NASA_API_KEY environment variable is not set.")
    sys.exit(1)

class NASADataFetcher:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.nasa.gov/DONKI"
    
    def fetch_cme_events(self, days_back=7):
        """Fetch Coronal Mass Ejection data"""
        url = f"{self.base_url}/CME"
        params = {
            'startDate': (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d'),
            'endDate': datetime.now().strftime('%Y-%m-%d'),
            'api_key': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            cme_data = response.json()
            
            # Process for latest CME
            latest_cme = self._process_cme_data(cme_data)
            return latest_cme
            
        except Exception as e:
            # Keeping original print for error logging
            print(f"Error fetching CME data: {e}") 
            return {'error': str(e), 'status': 'No CME data available'}
    
    def fetch_solar_flares(self, days_back=7):
        """Fetch Solar Flare data"""
        url = f"{self.base_url}/FLR"
        params = {
            'startDate': (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d'),
            'endDate': datetime.now().strftime('%Y-%m-%d'),
            'api_key': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            flare_data = response.json()
            
            # Process for latest/most significant flare
            latest_flare = self._process_flare_data(flare_data)
            return latest_flare
            
        except Exception as e:
            print(f"Error fetching solar flare data: {e}")
            return {'error': str(e), 'status': 'No flare data available'}
    
    def fetch_geomagnetic_storms(self, days_back=30):
        """Fetch Geomagnetic Storm data"""
        url = f"{self.base_url}/GST"
        params = {
            'startDate': (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d'),
            'endDate': datetime.now().strftime('%Y-%m-%d'),
            'api_key': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            storm_data = response.json()
            
            # Process for current storm activity
            current_storm = self._process_storm_data(storm_data)
            return current_storm
            
        except Exception as e:
            print(f"Error fetching geomagnetic storm data: {e}")
            return {'error': str(e), 'status': 'No storm data available'}
    
    # Removed: fetch_solar_wind()
    # Removed: fetch_sunspot_regions()
    # Removed: fetch_aurora_forecast()

    def _process_cme_data(self, cme_events):
        """Process CME data to extract relevant information"""
        if not cme_events:
            return {'activity_id': 'N/A', 'status': 'No recent CME events'}
        
        latest_cme = max(cme_events, key=lambda x: x.get('startTime', ''))
        cme_analyses = latest_cme.get('cmeAnalyses', [{}])
        first_analysis = cme_analyses[0] if cme_analyses else {}
        
        return {
            'activity_id': latest_cme.get('activityID', 'N/A'),
            'start_time': latest_cme.get('startTime', 'N/A'),
            'source_location': latest_cme.get('sourceLocation', 'N/A'),
            'speed': first_analysis.get('speed', 'N/A'),
            'type': first_analysis.get('type', 'N/A'),
            'latitude': first_analysis.get('latitude', 'N/A'),
            'longitude': first_analysis.get('longitude', 'N/A'),
            'half_angle': first_analysis.get('halfAngle', 'N/A'),
            'note': latest_cme.get('note', 'No additional notes'),
            'instruments': latest_cme.get('instruments', []),
            'fetch_time': datetime.now().isoformat()
        }
    
    def _process_flare_data(self, flare_events):
        """Process solar flare data"""
        if not flare_events:
            return {'class_type': 'N/A', 'status': 'No recent solar flares'}
        
        # Get the most significant flare (highest class)
        latest_flare = max(flare_events, key=lambda x: self._flare_class_priority(x.get('classType', '')))
        
        return {
            'activity_id': latest_flare.get('flrID', 'N/A'),
            'start_time': latest_flare.get('beginTime', 'N/A'),
            'peak_time': latest_flare.get('peakTime', 'N/A'),
            'end_time': latest_flare.get('endTime', 'N/A'),
            'class_type': latest_flare.get('classType', 'N/A'),
            'source_location': latest_flare.get('sourceLocation', 'N/A'),
            'active_region': latest_flare.get('activeRegionNum', 'N/A'),
            'linked_events': latest_flare.get('linkedEvents', []),
            'fetch_time': datetime.now().isoformat()
        }
    
    def _process_storm_data(self, storm_events):
        """Process geomagnetic storm data"""
        if not storm_events:
            return {'storm_level': 'None', 'status': 'No storm activity', 'kp_index': 'N/A'}
        
        # Get the most recent storm
        latest_storm = max(storm_events, key=lambda x: x.get('startTime', ''))
        
        # Extract Kp index
        kp_index = 'N/A'
        all_kp = latest_storm.get('allKpIndex', [])
        if all_kp and len(all_kp) > 0:
            kp_index = all_kp[0].get('kpIndex', 'N/A')
        
        return {
            'activity_id': latest_storm.get('gstID', 'N/A'),
            'start_time': latest_storm.get('startTime', 'N/A'),
            'kp_index': kp_index,
            'storm_level': self._get_storm_level(kp_index),
            'causes': latest_storm.get('causes', []),
            'fetch_time': datetime.now().isoformat()
        }
    
    # Removed: _process_wind_data()
    # Removed: _create_sunspot_summary()
    # Removed: _create_aurora_forecast()
    # Removed: _create_mock_wind_data()
    
    def _flare_class_priority(self, class_type):
        """Assign priority to flare classes for sorting (X > M > C > B > A)"""
        priority_map = {'X': 5, 'M': 4, 'C': 3, 'B': 2, 'A': 1}
        if class_type and len(class_type) > 0:
            return priority_map.get(class_type[0], 0)
        return 0
    
    def _get_storm_level(self, kp_index):
        """Determine storm level from Kp index"""
        try:
            kp_value = float(kp_index) if kp_index != 'N/A' else 0
            if kp_value >= 9: return 'G5 (Extreme)'
            elif kp_value >= 8: return 'G4 (Severe)'
            elif kp_value >= 7: return 'G3 (Strong)'
            elif kp_value >= 6: return 'G2 (Moderate)'
            elif kp_value >= 5: return 'G1 (Minor)'
            return 'None'
        except:
            return 'None'

def main():
    # Attempt to get API key from environment, fallback to hardcoded value if not set
    API_KEY = os.getenv("NASA_API_KEY", DEFAULT_API_KEY)
    
    if not API_KEY:
        sys.stderr.write("ERROR: NASA_API_KEY environment variable is not set. Cannot proceed.\n")
        return
    
    # --- CRITICAL FIX: Ensure Absolute Paths are used for file writing ---
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    def get_full_path(filename):
        return os.path.join(SCRIPT_DIR, filename)

    fetcher = NASADataFetcher(API_KEY)
    
    print("🌞 NASA Space Weather Data Fetcher")
    print("=" * 50)
    
    # Fetch only the three remaining live data types: CME, Flares, Storms
    print("\n1. Fetching CME Data...")
    cme_data = fetcher.fetch_cme_events()
    with open(get_full_path('cme_latest.json'), 'w') as f:
        json.dump(cme_data, f, indent=2)
    print(f"   CME Data: {cme_data.get('activity_id', 'No data')}")
    
    print("\n2. Fetching Solar Flare Data...")
    flare_data = fetcher.fetch_solar_flares()
    with open(get_full_path('solar_flares_latest.json'), 'w') as f:
        json.dump(flare_data, f, indent=2)
    print(f"   Flare Data: {flare_data.get('class_type', 'No data')}")
    
    print("\n3. Fetching Geomagnetic Storm Data...")
    storm_data = fetcher.fetch_geomagnetic_storms()
    with open(get_full_path('geomagnetic_storms_latest.json'), 'w') as f:
        json.dump(storm_data, f, indent=2)
    print(f"   Storm Data: {storm_data.get('storm_level', 'No data')}")
    
    # Removed: Section 4 (Solar Wind)
    # Removed: Section 5 (Sunspot)
    # Removed: Section 6 (Aurora)
    
    print(f"\n✅ All data fetches complete at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
