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
    
    return session



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



# Flask API Routes

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        "message": "FastF1 API is running",
        "endpoints": {
            "GET /": "This help message",
            "GET /api/health": "Health check",
            "GET /api/session/<year>/<grand_prix>/<session_type>/telemetry/<driver>": "Get driver telemetry"
        }
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "FastF1 API is running"})







@app.route('/api/session/<int:year>/<grand_prix>/<session_type>/telemetry/<driver_code>')
def get_driver_telemetry_api(year, grand_prix, session_type, driver_code):
    """Get telemetry data for a specific driver"""
    request_start_time = time.time()
    api_timing_info = {}
    
    try:
        # Get lap parameter from query string
        lap_number = request.args.get('lap', type=int)
        
        # Load session data
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
        
        return jsonify({
            "success": True,
            "telemetry": telemetry,
            "api_timing_info": api_timing_info,
            "optimization_info": {
                "sample_rate": telemetry.get("timing_info", {}).get("sample_rate", "unknown")
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


if __name__ == "__main__":
    print("Starting FastF1 API server...")
    
    # Initialize FastF1 with cache
    print("Setting up FastF1...")
    setup_fastf1()
    
    print("Available endpoints:")
    print("  GET / - API help")
    print("  GET /api/health - Health check")
    print("  GET /api/session/<year>/<grand_prix>/<session_type>/telemetry/<driver> - Get driver telemetry")
    print("\nExample usage:")
    print("  http://localhost:5000/api/session/2025/Monaco/Q/telemetry/NOR")
    print("\nNote: FastF1 cache is enabled to improve performance on subsequent requests.")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
