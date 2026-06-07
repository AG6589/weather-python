import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from services.weather_service import get_weather_data, WeatherServiceError

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configure a secret key for flask sessions or forms
app.secret_key = os.environ.get("SECRET_KEY", "fallback-secret-key-987654321")

@app.route("/")
def index():
    """
    Renders the main single-page dashboard.
    """
    return render_template("index.html")

@app.route("/api/weather", methods=["GET"])
def weather_api():
    """
    API endpoint that returns weather data.
    Supports queries by city: /api/weather?city=London
    Or by coordinates: /api/weather?lat=51.5074&lon=-0.1278
    """
    city = request.args.get("city")
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    
    # 1. Parse parameters
    params = {}
    if city:
        params["q"] = city.strip()
    elif lat and lon:
        try:
            params["lat"] = float(lat)
            params["lon"] = float(lon)
        except ValueError:
            return jsonify({"success": False, "error": "Latitude and longitude must be valid decimal numbers."}), 400
    else:
        return jsonify({"success": False, "error": "Missing search criteria. Please provide either a city name or latitude and longitude coordinates."}), 400

    # 2. Fetch data from weather service
    try:
        weather_data = get_weather_data(params)
        return jsonify({
            "success": True,
            "data": weather_data
        })
        
    except WeatherServiceError as e:
        # Custom known errors from OpenWeather
        return jsonify({
            "success": False,
            "error": str(e)
        }), e.status_code
        
    except Exception as e:
        # Fallback for unforeseen exceptions
        app.logger.error(f"Internal server error: {e}")
        return jsonify({
            "success": False,
            "error": "An internal server error occurred. Please try again later."
        }), 500

if __name__ == "__main__":
    # Retrieve port and debug mode configurations
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
