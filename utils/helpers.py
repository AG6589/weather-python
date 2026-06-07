from datetime import datetime, timedelta, timezone

def format_local_time(timestamp, timezone_offset_seconds):
    """
    Converts a UTC unix timestamp to a local time string (e.g., '06:34 AM')
    using the city's timezone offset in seconds.
    """
    try:
        if timestamp is None:
            return "N/A"
        # Convert timestamp to UTC datetime
        utc_time = datetime.fromtimestamp(timestamp, timezone.utc)
        # Shift by the offset
        local_time = utc_time + timedelta(seconds=timezone_offset_seconds)
        return local_time.strftime("%I:%M %p")
    except Exception as e:
        print(f"Error formatting local time: {e}")
        return "N/A"

def format_date(timestamp, timezone_offset_seconds):
    """
    Converts a UTC unix timestamp to a readable local date (e.g., 'Sunday, Jun 7')
    using the city's timezone offset in seconds.
    """
    try:
        if timestamp is None:
            return "N/A"
        utc_time = datetime.fromtimestamp(timestamp, timezone.utc)
        local_time = utc_time + timedelta(seconds=timezone_offset_seconds)
        return local_time.strftime("%A, %b %d")
    except Exception as e:
        print(f"Error formatting date: {e}")
        return "N/A"

def group_forecast_by_day(forecast_list, timezone_offset_seconds):
    """
    Groups 3-hour forecast blocks into daily summaries.
    Selects the forecast closest to local 12:00 PM for the daily description/icon,
    and calculates the absolute min/max temperatures for each day.
    """
    grouped = {}
    
    for item in forecast_list:
        dt = item.get("dt")
        if not dt:
            continue
        
        # Calculate local date for this forecast block
        utc_time = datetime.fromtimestamp(dt, timezone.utc)
        local_time = utc_time + timedelta(seconds=timezone_offset_seconds)
        date_str = local_time.strftime("%Y-%m-%d")
        
        # Parse temperature data
        main_data = item.get("main", {})
        temp = main_data.get("temp", 0)
        temp_min = main_data.get("temp_min", temp)
        temp_max = main_data.get("temp_max", temp)
        
        # Weather description details
        weather_list = item.get("weather", [{}])
        weather = weather_list[0] if weather_list else {}
        
        if date_str not in grouped:
            grouped[date_str] = {
                "date_str": date_str,
                "day_name": local_time.strftime("%A"),
                "date_display": local_time.strftime("%b %d"),
                "temps": [temp],
                "temp_min": temp_min,
                "temp_max": temp_max,
                "hourly_forecasts": []
            }
        else:
            # Update min/max temperatures
            grouped[date_str]["temps"].append(temp)
            if temp_min < grouped[date_str]["temp_min"]:
                grouped[date_str]["temp_min"] = temp_min
            if temp_max > grouped[date_str]["temp_max"]:
                grouped[date_str]["temp_max"] = temp_max
        
        # Keep track of local hour to find the block closest to 12:00 PM (noon)
        local_hour = local_time.hour
        grouped[date_str]["hourly_forecasts"].append({
            "hour_diff": abs(local_hour - 12),
            "condition": weather.get("main", "Clear"),
            "description": weather.get("description", "clear sky"),
            "icon": weather.get("icon", "01d")
        })

    # Consolidate daily entries
    daily_forecasts = []
    # Sort dates to ensure sequence
    for date_key in sorted(grouped.keys()):
        day_data = grouped[date_key]
        
        # Find the forecast closest to noon to represent the day's condition
        hourly = day_data["hourly_forecasts"]
        representative = min(hourly, key=lambda x: x["hour_diff"])
        
        daily_forecasts.append({
            "date": day_data["date_str"],
            "day_name": day_data["day_name"],
            "date_display": day_data["date_display"],
            "temp_min": round(day_data["temp_min"]),
            "temp_max": round(day_data["temp_max"]),
            "condition": representative["condition"],
            "description": representative["description"].title(),
            "icon": representative["icon"]
        })

    # Return up to 5 days. (If the list has 6 days due to timezone overlap, return the first 5)
    return daily_forecasts[:5]
