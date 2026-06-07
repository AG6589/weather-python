import os
import requests
from utils.helpers import format_local_time, format_date, group_forecast_by_day

class WeatherServiceError(Exception):
    """Custom exception class for Weather Service errors."""
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.status_code = status_code

def _fetch_from_api(endpoint, params):
    """
    Helper function to execute GET requests to OpenWeatherMap.
    Loads API key from environment variables.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if not api_key or api_key == "your_api_key_here" or api_key.strip() == "":
        raise WeatherServiceError(
            "OpenWeather API key is missing. Please configure a valid OPENWEATHER_API_KEY in the .env file.", 
            500
        )
    
    # Copy parameters and inject api credentials
    api_params = params.copy()
    api_params["appid"] = api_key
    api_params["units"] = "metric"  # Metric units for Celsius, m/s wind speed
    
    url = f"https://api.openweathermap.org/data/2.5/{endpoint}"
    
    try:
        response = requests.get(url, params=api_params, timeout=10)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            raise WeatherServiceError("City not found. Please verify the name and try again.", 404)
        elif response.status_code == 401:
            raise WeatherServiceError("Invalid API key. Please check your OpenWeather API credentials.", 401)
        else:
            data = response.json()
            error_message = data.get("message", "An unexpected error occurred while communicating with the weather service.")
            raise WeatherServiceError(error_message.capitalize(), response.status_code)
            
    except requests.exceptions.Timeout:
        raise WeatherServiceError("Connection to the weather service timed out. Please try again later.", 504)
    except requests.exceptions.RequestException as e:
        raise WeatherServiceError(f"Network error: Unable to connect to OpenWeather API. {str(e)}", 500)

def get_weather_data(query_params):
    """
    Fetches both current weather and 5-day forecast.
    Combines and parses the data into a single unified JSON response.
    
    `query_params` is a dict. Typically:
      - For city lookup: {"q": "London"}
      - For location lookup: {"lat": 51.5074, "lon": -0.1278}
    """
    # 1. Fetch current weather
    current_raw = _fetch_from_api("weather", query_params)
    
    # Extract coordinates from current weather for forecast query if they aren't already provided
    # This ensures accuracy by querying forecast using precise latitude/longitude
    coord = current_raw.get("coord", {})
    lat = coord.get("lat")
    lon = coord.get("lon")
    
    forecast_params = {}
    if lat is not None and lon is not None:
        forecast_params = {"lat": lat, "lon": lon}
    else:
        forecast_params = query_params.copy()
        
    # 2. Fetch 5-day / 3-hour forecast
    forecast_raw = _fetch_from_api("forecast", forecast_params)
    
    # 3. Format and unify the data
    timezone_offset = current_raw.get("timezone", 0)
    sys_data = current_raw.get("sys", {})
    main_data = current_raw.get("main", {})
    wind_data = current_raw.get("wind", {})
    weather_list = current_raw.get("weather", [{}])
    weather_info = weather_list[0] if weather_list else {}
    
    # Format Sunrise and Sunset
    sunrise_time = format_local_time(sys_data.get("sunrise"), timezone_offset)
    sunset_time = format_local_time(sys_data.get("sunset"), timezone_offset)
    current_date = format_date(current_raw.get("dt"), timezone_offset)
    
    # Group forecast into daily summaries
    forecast_list = forecast_raw.get("list", [])
    daily_forecasts = group_forecast_by_day(forecast_list, timezone_offset)
    
    unified_data = {
        "city": current_raw.get("name"),
        "country": sys_data.get("country"),
        "latitude": lat,
        "longitude": lon,
        "date": current_date,
        "temperature": round(main_data.get("temp", 0)),
        "feels_like": round(main_data.get("feels_like", 0)),
        "temp_min": round(main_data.get("temp_min", 0)),
        "temp_max": round(main_data.get("temp_max", 0)),
        "humidity": main_data.get("humidity"),
        "pressure": main_data.get("pressure"),
        "wind_speed": round(wind_data.get("speed", 0) * 3.6, 1), # Convert m/s to km/h
        "condition": weather_info.get("main", "Unknown"),
        "description": weather_info.get("description", "").title(),
        "icon": weather_info.get("icon", "01d"),
        "sunrise": sunrise_time,
        "sunset": sunset_time,
        "forecast": daily_forecasts
    }
    
    return unified_data
