import pandas as pd
import numpy as np
import fastf1
import json
from typing import Dict, List, Any
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

def setup_fastf1():
    """Set up matplotlib for FastF1 plotting"""
    fastf1.plotting.setup_mpl(mpl_timedelta_support=True)

def get_session_data(year, grand_prix, session_type):
    """Get and load session data"""
    session = fastf1.get_session(year, grand_prix, session_type)
    session.load(telemetry=True, laps=True, weather=False)
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

def get_driver_telemetry(session, driver_code, lap_number: int = None) -> Dict[str, Any]:
    """Get telemetry data for a specific driver's lap
    
    Args:
        session: FastF1 session object
        driver_code: Driver code (e.g., 'NOR', 'LEC')
        lap_number: Specific lap number to get telemetry for. If None, gets fastest lap.
    """
    if lap_number is not None:
        # Get specific lap by number
        driver_lap = session.laps.pick_drivers(driver_code).pick_lap(lap_number)
        if driver_lap is None or len(driver_lap) == 0:
            return {
                "driver_code": driver_code,
                "lap_number": lap_number,
                "error": f"No lap {lap_number} found for driver {driver_code}",
                "data_points": []
            }
        # Use the first lap if multiple found
        selected_lap = driver_lap.iloc[0] if hasattr(driver_lap, 'iloc') else driver_lap
    else:
        # Get fastest lap (original behavior)
        selected_lap = session.laps.pick_drivers(driver_code).pick_fastest()
    
    telemetry = selected_lap.get_car_data().add_distance()
    
    # Convert telemetry data to JSON-serializable format
    telemetry_data = {
        "driver_code": driver_code,
        "lap_number": selected_lap["LapNumber"] if "LapNumber" in selected_lap else lap_number,
        "lap_time": str(selected_lap["LapTime"]) if "LapTime" in selected_lap else None,
        "data_points": []
    }
    
    # Sample data points (you can adjust the sampling rate)
    for i in range(0, len(telemetry), max(1, len(telemetry) // 100)):  # Sample 100 points
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
        session = get_session_data(year, grand_prix, session_type)
        
        # Get session summary
        session_summary = get_session_summary(session)
        
        # Get fastest lap info
        fastest_lap = get_fastest_lap_info(session)
        
        # Get specific driver info (you can make this configurable)
        leclerc_lap = get_driver_lap_info(session, "LEC")
        norris_lap = get_driver_lap_info(session, "NOR")
        
        # Get telemetry data
        nor_telemetry = get_driver_telemetry(session, "NOR", lap_number)
        
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
            "GET /api/session/<year>/<grand_prix>/<session_type>": "Get session analysis",
            "GET /api/session/<year>/<grand_prix>/<session_type>/telemetry/<driver>": "Get driver telemetry",
            "GET /api/health": "Health check"
        }
    })

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "FastF1 API is running"})

@app.route('/api/session/<int:year>/<grand_prix>/<session_type>')
def get_session_data_api(year, grand_prix, session_type):
    """Get complete session analysis"""
    try:
        # Get lap parameter from query string
        lap_number = request.args.get('lap', type=int)
        
        result = analyze_session(year, grand_prix, session_type, lap_number)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to get session data"
        }), 500

@app.route('/api/session/<int:year>/<grand_prix>/<session_type>/telemetry/<driver_code>')
def get_driver_telemetry_api(year, grand_prix, session_type, driver_code):
    """Get telemetry data for a specific driver"""
    try:
        # Get lap parameter from query string
        lap_number = request.args.get('lap', type=int)
        # setup_fastf1()
        
        # Use selective loading - only load data for the specific driver
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=True, laps=True, weather=False)
        
        telemetry = get_driver_telemetry(session, driver_code.upper(), lap_number)
        
        # Check if there was an error
        if "error" in telemetry:
            return jsonify({
                "success": False,
                "error": telemetry["error"]
            }), 400
        
        return jsonify({
            "success": True,
            "telemetry": telemetry
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"Failed to get telemetry for driver {driver_code}"
        }), 500

@app.route('/api/session/<int:year>/<grand_prix>/<session_type>/drivers')
def get_session_drivers_api(year, grand_prix, session_type):
    """Get list of drivers in the session"""
    try:
        session = get_session_data(year, grand_prix, session_type)
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
    print("Available endpoints:")
    print("  GET / - API help")
    print("  GET /api/health - Health check")
    print("  GET /api/session/<year>/<grand_prix>/<session_type> - Session analysis")
    print("  GET /api/session/<year>/<grand_prix>/<session_type>/telemetry/<driver> - Driver telemetry")
    print("  GET /api/session/<year>/<grand_prix>/<session_type>/drivers - Session drivers")
    print("\nExample usage:")
    print("  http://localhost:5000/api/session/2025/Monaco/Q")
    print("  http://localhost:5000/api/session/2025/Monaco/Q/telemetry/NOR")
    print("  http://localhost:5000/api/session/2025/Monaco/Q/drivers")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
