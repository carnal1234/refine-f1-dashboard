import pandas as pd
import numpy as np
import fastf1
import json
import time
import os
from typing import Dict, List, Any
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Session caching to avoid reloading
session_cache = {}

def setup_cache():
    """Set up FastF1 cache directory and enable caching"""
    # Create cache directory relative to the backend folder
    cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
    
    # Create cache directory if it doesn't exist
    os.makedirs(cache_dir, exist_ok=True)
    
    # Enable FastF1 cache
    fastf1.Cache.enable_cache(cache_dir)
    
    print(f"FastF1 cache enabled at: {cache_dir}")
    return cache_dir

def setup_fastf1():
    """Set up matplotlib for FastF1 plotting and cache"""
    setup_cache()

def get_session_data_optimized(year, grand_prix, session_type, load_telemetry=True):
    """Get and load session data with optimization options"""
    cache_key = f"{year}_{grand_prix}_{session_type}_{load_telemetry}"
    
    # Check cache first
    if cache_key in session_cache:
        print(f"Using cached session: {cache_key}")
        return session_cache[cache_key]
    
    session_creation_start = time.time()
    session = fastf1.get_session(year, grand_prix, session_type)
    session_creation_time = time.time() - session_creation_start
    
    session_loading_start = time.time()
    
    if load_telemetry:
        print(f"Loading telemetry data for {year} {grand_prix} {session_type}...")
        session.load(telemetry=True, laps=True, weather=False)
    else:
        print(f"Loading basic session data (no telemetry) for {year} {grand_prix} {session_type}...")
        session.load(telemetry=False, laps=True, weather=False)
    
    session_loading_time = time.time() - session_loading_start
    
    # Add timing info to session object for debugging
    session._timing_info = {
        "session_creation_time": session_creation_time,
        "session_loading_time": session_loading_time,
        "total_session_setup_time": session_creation_time + session_loading_time,
        "load_telemetry": load_telemetry
    }
    
    # Cache the session (with a reasonable expiration)
    session_cache[cache_key] = session
    print(f"Cached session: {cache_key}")
    
    # Clean up old cache entries (keep last 10)
    if len(session_cache) > 10:
        oldest_key = next(iter(session_cache))
        del session_cache[oldest_key]
    
    return session

def get_fastest_lap_info(session) -> Dict[str, Any]:
    """Get information about the fastest lap"""
    fastest_lap = session.laps.pick_fastest()
    return {
        "driver": fastest_lap['Driver'],
        "lap_time": str(fastest_lap['LapTime']),
        "lap_number": fastest_lap['LapNumber'],
        "sector1_time": str(fastest_lap['Sector1Time']) if fastest_lap['Sector1Time'] else None,
        "sector2_time": str(fastest_lap['Sector2Time']) if fastest_lap['Sector2Time'] else None,
        "sector3_time": str(fastest_lap['Sector3Time']) if fastest_lap['Sector3Time'] else None
    }

def get_driver_lap_info(session, driver_code) -> Dict[str, Any]:
    """Get specific driver's fastest lap information"""
    driver_lap = session.laps.pick_drivers(driver_code).pick_fastest()
    return {
        "driver_code": driver_code,
        "lap_time": str(driver_lap["LapTime"]),
        "lap_time_seconds": driver_lap["LapTime"].total_seconds(),
        "lap_number": driver_lap["LapNumber"],
        "sector1_time": str(driver_lap["Sector1Time"]) if driver_lap["Sector1Time"] else None,
        "sector2_time": str(driver_lap["Sector2Time"]) if driver_lap["Sector2Time"] else None,
        "sector3_time": str(driver_lap["Sector3Time"]) if driver_lap["Sector3Time"] else None
    }

def get_driver_telemetry_optimized(session, driver_code, lap_number: int = None):
    """Get telemetry data with optimization for specific driver/lap"""
    start_time = time.time()
    timing_info = {}
    
    # Time lap selection
    lap_selection_start = time.time()
    if lap_number is not None:
        # Get specific lap by number
        driver_lap = session.laps.pick_drivers(driver_code).pick_lap(lap_number)
        if driver_lap is None or len(driver_lap) == 0:
            return {
                "driver_code": driver_code,
                "lap_number": lap_number,
                "error": f"No lap {lap_number} found for driver {driver_code}",
                "data_points": [],
                "timing_info": {"total_time": time.time() - start_time}
            }
        selected_lap = driver_lap.iloc[0] if hasattr(driver_lap, 'iloc') else driver_lap
    else:
        # Get fastest lap
        selected_lap = session.laps.pick_drivers(driver_code).pick_fastest()
    
    timing_info["lap_selection_time"] = time.time() - lap_selection_start
    
    # Time telemetry data retrieval
    telemetry_start = time.time()
    telemetry = selected_lap.get_car_data().add_distance()
    timing_info["telemetry_retrieval_time"] = time.time() - telemetry_start
    
    # Time data processing with optimization
    processing_start = time.time()
    
    # Optimize data sampling - reduce from 100 to 50 points for better performance
    sample_rate = max(1, len(telemetry) // 50)  # Sample 50 points instead of 100
    
    telemetry_data = {
        "driver_code": driver_code,
        "lap_number": selected_lap["LapNumber"] if "LapNumber" in selected_lap else lap_number,
        "lap_time": str(selected_lap["LapTime"]) if "LapTime" in selected_lap else None,
        "data_points": []
    }
    
    # Process data points with optimized sampling
    for i in range(0, len(telemetry), sample_rate):
        point = telemetry.iloc[i]
        telemetry_data["data_points"].append({
            "distance": float(point['Distance']) if pd.notna(point['Distance']) else None,
            "speed": float(point['Speed']) if pd.notna(point['Speed']) else None,
            "throttle": float(point['Throttle']) if pd.notna(point['Throttle']) else None,
            "brake": float(point['Brake']) if pd.notna(point['Brake']) else None,
            "rpm": float(point['RPM']) if pd.notna(point['RPM']) else None,
            "gear": int(point['nGear']) if pd.notna(point['nGear']) else None,
            "drs": int(point['DRS']) if pd.notna(point['DRS']) else None,
            "timestamp": int(point.name) if point.name else None,
            "driver_code": driver_code
        })
    
    timing_info["data_processing_time"] = time.time() - processing_start
    timing_info["total_time"] = time.time() - start_time
    timing_info["data_points_count"] = len(telemetry_data["data_points"])
    timing_info["sample_rate"] = sample_rate
    
    telemetry_data["timing_info"] = timing_info
    
    return telemetry_data

def get_session_summary(session) -> Dict[str, Any]:
    """Get overall session summary"""
    laps = session.laps
    drivers = session.drivers
    
    return {
        "session_info": {
            "year": session.event.year,
            "grand_prix": session.event.EventName,
            "session_type": session.session_type,
            "track_name": session.event.TrackName,
            "total_laps": len(laps),
            "total_drivers": len(drivers)
        },
        "drivers": [
            {
                "driver_code": driver,
                "driver_number": int(session.get_driver(driver)['DriverNumber']),
                "team_name": session.get_driver(driver)['TeamName']
            }
            for driver in drivers
        ]
    }

def analyze_session(year: int, grand_prix: str, session_type: str, lap_number: int = None) -> Dict[str, Any]:
    """Main function to analyze session and return JSON data"""
    try:
        # Setup
        setup_fastf1()
        
        # Get session data
        session = get_session_data_optimized(year, grand_prix, session_type, load_telemetry=True)
        
        # Get session summary
        session_summary = get_session_summary(session)
        
        # Get fastest lap info
        fastest_lap = get_fastest_lap_info(session)
        
        # Get specific driver info (you can make this configurable)
        leclerc_lap = get_driver_lap_info(session, "LEC")
        norris_lap = get_driver_lap_info(session, "NOR")
        
        # Get telemetry data
        nor_telemetry = get_driver_telemetry_optimized(session, "NOR", lap_number)
        
        # Compile all data
        result = {
            "success": True,
            "session_summary": session_summary,
            "fastest_lap": fastest_lap,
            "driver_laps": {
                "LEC": leclerc_lap,
                "NOR": norris_lap
            },
            "telemetry": {
                "NOR": nor_telemetry
            }
        }
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze session"
        }

# Flask API Routes

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        "message": "FastF1 API is running",
        "endpoints": {
            "GET /": "This help message",
            "GET /api/session/<year>/<grand_prix>/<session_type>": "Pre-cache session data (call when user enters page)",
            "GET /api/session/<year>/<grand_prix>/<session_type>/preload": "Alternative preload endpoint",
            "GET /api/session/<year>/<grand_prix>/<session_type>/telemetry/<driver>": "Get driver telemetry (uses cache)",
            "GET /api/session/<year>/<grand_prix>/<session_type>/drivers": "Get session drivers",
            "GET /api/health": "Health check",
            "GET /api/cache/status": "Get cache status and information",
            "GET /api/cache/sessions": "Get cached sessions information",
            "GET /api/cache/sessions/clear": "Clear all cached sessions"
        }
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "FastF1 API is running"})

@app.route('/api/cache/status')
def cache_status():
    """Get cache status and information"""
    try:
        cache_dir = os.path.join(os.path.dirname(__file__), 'cache')
        cache_exists = os.path.exists(cache_dir)
        
        cache_info = {
            "cache_enabled": True,
            "cache_directory": cache_dir,
            "cache_exists": cache_exists
        }
        
        if cache_exists:
            # Get cache directory size
            total_size = 0
            file_count = 0
            for dirpath, dirnames, filenames in os.walk(cache_dir):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    total_size += os.path.getsize(filepath)
                    file_count += 1
            
            cache_info.update({
                "cache_size_bytes": total_size,
                "cache_size_mb": round(total_size / (1024 * 1024), 2),
                "cached_files_count": file_count
            })
        
        return jsonify({
            "success": True,
            "cache_info": cache_info
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to get cache status"
        }), 500

@app.route('/api/cache/sessions')
def get_session_cache_status():
    """Get information about cached sessions"""
    try:
        cache_info = {
            "total_cached_sessions": len(session_cache),
            "cached_sessions": []
        }
        
        for cache_key, session in session_cache.items():
            timing_info = getattr(session, '_timing_info', {})
            cache_info["cached_sessions"].append({
                "cache_key": cache_key,
                "session_info": {
                    "year": session.event.year if hasattr(session, 'event') else "unknown",
                    "grand_prix": session.event.EventName if hasattr(session, 'event') else "unknown",
                    "session_type": session.session_type if hasattr(session, 'session_type') else "unknown"
                },
                "timing_info": timing_info,
                "drivers_available": len(session.drivers) if hasattr(session, 'drivers') else 0
            })
        
        return jsonify({
            "success": True,
            "cache_info": cache_info
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to get session cache status"
        }), 500

@app.route('/api/cache/sessions/clear')
def clear_session_cache():
    """Clear all cached sessions"""
    global session_cache
    cleared_count = len(session_cache)
    session_cache = {}
    return jsonify({
        "success": True,
        "message": f"Cleared {cleared_count} cached sessions"
    })

# @app.route('/api/session/<int:year>/<grand_prix>/<session_type>')
# def get_session_data_api(year, grand_prix, session_type):
#     """Get complete session analysis"""
#     try:
#         # Get lap parameter from query string
#         lap_number = request.args.get('lap', type=int)
        
#         result = analyze_session(year, grand_prix, session_type, lap_number)
#         return jsonify(result)
#     except Exception as e:
#         return jsonify({
#             "success": False,
#             "error": str(e),
#             "message": "Failed to get session data"
#         }), 500

@app.route('/api/session/<int:year>/<grand_prix>/<session_type>')
def cache_session_data(year, grand_prix, session_type):
    """Pre-cache session data for faster subsequent requests"""
    try:
        request_start_time = time.time()
        
        # Check if session is already cached
        cache_key = f"{year}_{grand_prix}_{session_type}_True"
        if cache_key in session_cache:
            return jsonify({
                "success": True,
                "message": "Session already cached",
                "cache_key": cache_key,
                "cached": True,
                "timing_info": {
                    "total_time": time.time() - request_start_time,
                    "session_loading_time": 0  # Already cached
                }
            })
        
        # Pre-cache the session with telemetry data
        print(f"Pre-caching session: {year} {grand_prix} {session_type}")
        session_start_time = time.time()
        session = get_session_data_optimized(year, grand_prix, session_type, load_telemetry=True)
        session_loading_time = time.time() - session_start_time
        
        # Get basic session info to return
        session_summary = get_session_summary(session)
        drivers_list = []
        for driver_code in session.drivers:
            driver_info = session.get_driver(driver_code)
            drivers_list.append({
                "driver_code": driver_code,
                "driver_number": int(driver_info['DriverNumber']),
                "team_name": driver_info['TeamName'],
                "full_name": driver_info['FullName'] if 'FullName' in driver_info else None
            })
        
        return jsonify({
            "success": True,
            "message": "Session cached successfully",
            "cache_key": cache_key,
            "cached": False,  # This was the first time caching
            "session_info": {
                "year": session.event.year,
                "grand_prix": session.event.EventName,
                "session_type": session.session_type,
                "track_name": session.event.TrackName,
                "total_drivers": len(session.drivers),
                "drivers": drivers_list
            },
            "timing_info": {
                "total_time": time.time() - request_start_time,
                "session_loading_time": session_loading_time
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"Failed to cache session {year} {grand_prix} {session_type}"
        }), 500

@app.route('/api/session/<int:year>/<grand_prix>/<session_type>/preload')
def preload_session_data(year, grand_prix, session_type):
    """Alternative endpoint specifically for preloading session data"""
    try:
        request_start_time = time.time()
        
        # Check if session is already cached
        cache_key = f"{year}_{grand_prix}_{session_type}_True"
        if cache_key in session_cache:
            return jsonify({
                "success": True,
                "message": "Session already preloaded",
                "cache_key": cache_key,
                "already_cached": True,
                "timing_info": {
                    "total_time": time.time() - request_start_time
                }
            })
        
        # Preload the session
        print(f"Preloading session: {year} {grand_prix} {session_type}")
        session_start_time = time.time()
        session = get_session_data_optimized(year, grand_prix, session_type, load_telemetry=True)
        session_loading_time = time.time() - session_start_time
        
        return jsonify({
            "success": True,
            "message": "Session preloaded successfully",
            "cache_key": cache_key,
            "already_cached": False,
            "timing_info": {
                "total_time": time.time() - request_start_time,
                "session_loading_time": session_loading_time
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"Failed to preload session {year} {grand_prix} {session_type}"
        }), 500

@app.route('/api/session/<int:year>/<grand_prix>/<session_type>/telemetry/<driver_code>')
def get_driver_telemetry_api(year, grand_prix, session_type, driver_code):
    """Get telemetry data for a specific driver with caching"""
    request_start_time = time.time()
    api_timing_info = {}
    
    try:
        # Get lap parameter from query string
        lap_number = request.args.get('lap', type=int)
        
        # Use optimized session loading with caching
        session_start_time = time.time()
        session = get_session_data_optimized(year, grand_prix, session_type, load_telemetry=True)
        api_timing_info["session_loading_time"] = time.time() - session_start_time
        
        # Get telemetry using optimized function
        telemetry = get_driver_telemetry_optimized(session, driver_code.upper(), lap_number)
        
        # Check if there was an error
        if "error" in telemetry:
            return jsonify({
                "success": False,
                "error": telemetry["error"],
                "api_timing_info": {
                    "total_request_time": time.time() - request_start_time,
                    "session_loading_time": api_timing_info["session_loading_time"]
                }
            }), 400
        
        # Add API-level timing info
        api_timing_info["total_request_time"] = time.time() - request_start_time
        
        # Check if session was cached
        cache_key = f"{year}_{grand_prix}_{session_type}_True"
        session_was_cached = cache_key in session_cache
        
        return jsonify({
            "success": True,
            "telemetry": telemetry,
            "api_timing_info": api_timing_info,
            "optimization_info": {
                "session_cached": session_was_cached,
                "sample_rate": telemetry.get("timing_info", {}).get("sample_rate", "unknown"),
                "cache_key": cache_key
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"Failed to get telemetry for driver {driver_code}",
            "api_timing_info": {
                "total_request_time": time.time() - request_start_time,
                "session_loading_time": api_timing_info.get("session_loading_time", 0)
            }
        }), 500

@app.route('/api/session/<int:year>/<grand_prix>/<session_type>/drivers')
def get_session_drivers_api(year, grand_prix, session_type):
    """Get list of drivers in the session"""
    try:
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=False, laps=True, weather=False) # Load only basic data for drivers
        drivers = session.drivers
        
        drivers_list = []
        for driver_code in drivers:
            driver_info = session.get_driver(driver_code)
            drivers_list.append({
                "driver_code": driver_code,
                "driver_number": int(driver_info['DriverNumber']),
                "team_name": driver_info['TeamName'],
                "full_name": driver_info['FullName'] if 'FullName' in driver_info else None
            })
        
        return jsonify({
            "success": True,
            "drivers": drivers_list
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to get drivers list"
        }), 500

if __name__ == "__main__":
    print("Starting FastF1 API server...")
    
    # Initialize FastF1 with cache
    print("Setting up FastF1...")
    setup_fastf1()
    
    print("Available endpoints:")
    print("  GET / - API help")
    print("  GET /api/health - Health check")
    print("  GET /api/cache/status - Cache status and information")
    print("  GET /api/session/<year>/<grand_prix>/<session_type> - Pre-cache session data (call when user enters page)")
    print("  GET /api/session/<year>/<grand_prix>/<session_type>/preload - Alternative preload endpoint")
    print("  GET /api/session/<year>/<grand_prix>/<session_type>/telemetry/<driver> - Get driver telemetry (uses cache)")
    print("  GET /api/session/<year>/<grand_prix>/<session_type>/drivers - Session drivers")
    print("\nExample usage:")
    print("  http://localhost:5000/api/session/2025/Monaco/Q")
    print("  http://localhost:5000/api/session/2025/Monaco/Q/preload")
    print("  http://localhost:5000/api/session/2025/Monaco/Q/telemetry/NOR")
    print("  http://localhost:5000/api/session/2025/Monaco/Q/drivers")
    print("\nNote: FastF1 cache is enabled to improve performance on subsequent requests.")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
