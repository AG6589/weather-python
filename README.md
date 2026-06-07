# SkyFlow | Modern Glassmorphic Weather Dashboard

SkyFlow is a modern, responsive, full-stack weather application. It is built on a clean python/Flask backend and an interactive Bootstrap 5 frontend featuring custom Glassmorphism components, dark/light theme options, local storage cache, and native browser geolocation tracking.

---

## Features

1. **Weather Search**
   - Lookup weather reports for any city around the globe.
   - Fluid loaders during request resolution.
   - Comprehensive frontend and backend error notification systems.

2. **Full Weather Details**
   - Current temperature & "Feels Like" index.
   - Dynamic high & low temperature spreads.
   - Real-time weather condition flags, descriptive titles, and illustrative visual icon tags.
   - Humidity percentage, Barometric atmospheric pressure, and Wind speed.
   - Precision timezone-shifted Sunrise and Sunset calculations representing the local time of the searched city.

3. **5-Day Weather Forecast**
   - Clean card grids showing daily summaries.
   - Displays forecast date, day name, minimum/maximum daily temperatures, and representative condition icons.

4. **Premium Frontend UI**
   - Aesthetically polished Glassmorphism card elements (`backdrop-filter`).
   - Clean Typography using Google Fonts (Outfit).
   - Dynamic weather backgrounds: Changes color scheme gradients based on the city's active weather conditions (Clear, Clouds, Rain, Snow, Storms, Mist).
   - Theme Customization: Easy toggle switch for Dark and Light modes. Theme choices persist across user sessions.
   - Native Geolocation Auto-Detection.
   - Search History Badges stored inside the user's Local Storage. Users can click badges to revisit previous queries or remove them.
   - Manual Refresh triggers with interactive spin animations.

---

## Technical Stack & Architecture

- **Backend**: Python, Flask, Requests, Python-dotenv
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons
- **APIs**: OpenWeatherMap API (Current Weather and 5-Day/3-Hour Forecast endpoints)

```
weather-dashboard/
│
├── app.py                     # Flask application entry point
├── requirements.txt           # Python application dependencies
├── .env                       # Local environment variables configuration (ignored by git)
│
├── services/
│   └── weather_service.py     # Main API client handling external calls & parsing
│
├── utils/
│   └── helpers.py             # Timezone conversions and daily aggregation helpers
│
├── templates/
│   └── index.html             # UI HTML markup skeleton
│
└── static/
    ├── css/
    │   └── styles.css         # Styling system, themes, and micro-animations
    ├── js/
    │   └── app.js             # Client state management, local storage, & DOM manipulation
    └── images/                # Static image assets
```

---

## Getting Started

### Prerequisites
- Python 3.8 or higher installed on your local machine.

### 1. Obtain an OpenWeatherMap API Key
1. Visit [OpenWeatherMap Portal](https://openweathermap.org/) and create a free account.
2. Navigate to your **API Keys** tab under your profile menu.
3. Generate a new API key named `SkyFlow-Dashboard` (or any custom label).
4. Copy the generated API Key. *Note: Newly generated keys may take 10-20 minutes to activate.*

### 2. Project Installation
Clone or navigate to the project directory:
```bash
cd weather-dashboard
```

### 3. Setup Virtual Environment (Recommended)
On Windows:
```powershell
python -m venv venv
venv\Scripts\activate
```

On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Configuration Setup
Create a file named `.env` in the root folder (or modify the existing one) and add your OpenWeather API key:
```env
OPENWEATHER_API_KEY=your_copied_api_key_here
FLASK_ENV=development
PORT=5000
SECRET_KEY=dev-secret-key-12345
```

### 6. Run the Application
Start the Flask local development server:
```bash
python app.py
```
Open your browser and navigate to: [http://127.0.0.1:5000](http://127.0.0.1:5000)
