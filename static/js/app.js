/**
 * SkyFlow Weather Dashboard - Frontend Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("search-input");
    const themeCheckbox = document.getElementById("checkbox");
    const geoBtn = document.getElementById("geo-btn");
    const refreshBtn = document.getElementById("refresh-btn");
    const refreshIcon = document.getElementById("refresh-icon");
    const loadingOverlay = document.getElementById("loading-overlay");
    const errorCardWrap = document.getElementById("error-card-wrap");
    const errorMessageText = document.getElementById("error-message-text");
    const errorClose = document.getElementById("error-close");
    
    // History Panel
    const searchHistoryContainer = document.getElementById("search-history-container");
    const historyBadges = document.getElementById("history-badges");
    const clearHistoryBtn = document.getElementById("clear-history-btn");

    // Weather Card DOM Elements
    const dashboardContent = document.getElementById("weather-dashboard-content");
    const cityNameEl = document.getElementById("city-name");
    const currentDateEl = document.getElementById("current-date");
    const countryBadgeEl = document.getElementById("country-badge");
    const currentTempEl = document.getElementById("current-temp");
    const feelsLikeTempEl = document.getElementById("feels-like-temp");
    const weatherIconLgEl = document.getElementById("weather-icon-lg");
    const weatherConditionMainEl = document.getElementById("weather-condition-main");
    const weatherDescriptionEl = document.getElementById("weather-description");
    const tempMinEl = document.getElementById("temp-min");
    const tempMaxEl = document.getElementById("temp-max");
    
    // Metric Cards
    const humidityValueEl = document.getElementById("humidity-value");
    const windValueEl = document.getElementById("wind-value");
    const pressureValueEl = document.getElementById("pressure-value");
    const sunriseValueEl = document.getElementById("sunrise-value");
    const sunsetValueEl = document.getElementById("sunset-value");

    // Forecast Grid
    const forecastCardsRow = document.getElementById("forecast-cards-row");

    // State Variables
    let currentCity = "";
    let currentCoords = null; // { lat, lon }
    const localStorageHistoryKey = "skyflow_search_history";
    const localStorageThemeKey = "skyflow_theme";

    /**
     * INITIALIZATION
     */
    function init() {
        // 1. Setup Theme from storage
        const savedTheme = localStorage.getItem(localStorageThemeKey) || "dark";
        document.documentElement.setAttribute("data-theme", savedTheme);
        themeCheckbox.checked = (savedTheme === "dark");
        
        // 2. Setup Event Listeners
        themeCheckbox.addEventListener("change", handleThemeToggle);
        searchForm.addEventListener("submit", handleSearchSubmit);
        geoBtn.addEventListener("click", handleGeolocationRequest);
        refreshBtn.addEventListener("click", handleRefreshRequest);
        clearHistoryBtn.addEventListener("click", clearSearchHistory);
        errorClose.addEventListener("click", () => errorCardWrap.classList.add("d-none"));

        // 3. Render Search History
        renderSearchHistory();

        // 4. Initial Load: Try to load last search, or geolocation, or default to London
        const history = getSearchHistory();
        if (history.length > 0) {
            fetchWeatherData({ city: history[0] });
        } else {
            // Default load
            fetchWeatherData({ city: "London" });
        }
    }

    /**
     * THEME MANAGEMENT
     */
    function handleThemeToggle(e) {
        const theme = e.target.checked ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem(localStorageThemeKey, theme);
    }

    /**
     * LOADER STATE MANAGEMENT
     */
    function showLoader() {
        loadingOverlay.classList.remove("fade-out");
        refreshIcon.classList.add("spin");
    }

    function hideLoader() {
        loadingOverlay.classList.add("fade-out");
        refreshIcon.classList.remove("spin");
    }

    /**
     * API FETCH CALLS
     */
    async function fetchWeatherData(params) {
        showLoader();
        errorCardWrap.classList.add("d-none"); // Hide errors

        let url = "/api/weather";
        const queryParams = new URLSearchParams();

        if (params.city) {
            queryParams.append("city", params.city);
        } else if (params.lat && params.lon) {
            queryParams.append("lat", params.lat);
            queryParams.append("lon", params.lon);
        }

        try {
            const response = await fetch(`${url}?${queryParams.toString()}`);
            const result = await response.json();

            if (result.success && result.data) {
                renderDashboard(result.data);
                
                // Save search to history if queried by city name
                if (result.data.city) {
                    addToSearchHistory(result.data.city);
                }
                
                // Cache active states for refresh capability
                currentCity = result.data.city;
                currentCoords = { lat: result.data.latitude, lon: result.data.longitude };
            } else {
                showError(result.error || "Failed to retrieve weather data.");
            }
        } catch (error) {
            showError("A connection error occurred. Please check your network and try again.");
            console.error("API error:", error);
        } finally {
            hideLoader();
        }
    }

    /**
     * SEARCH ACTIONS
     */
    function handleSearchSubmit(e) {
        e.preventDefault();
        const cityQuery = searchInput.value.trim();
        if (cityQuery) {
            fetchWeatherData({ city: cityQuery });
            searchInput.value = "";
        }
    }

    function handleRefreshRequest() {
        if (currentCoords) {
            fetchWeatherData({ lat: currentCoords.lat, lon: currentCoords.lon });
        } else if (currentCity) {
            fetchWeatherData({ city: currentCity });
        } else {
            fetchWeatherData({ city: "London" });
        }
    }

    function handleGeolocationRequest() {
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser.");
            return;
        }

        showLoader();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherData({ lat, lon });
            },
            (error) => {
                hideLoader();
                let message = "Unable to retrieve your location.";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location permission denied. Please allow browser location access.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        message = "The request to get user location timed out.";
                        break;
                }
                showError(message);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    }

    /**
     * ERROR VISUALIZATION
     */
    function showError(message) {
        errorMessageText.textContent = message;
        errorCardWrap.classList.remove("d-none");
        errorCardWrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    /**
     * DYNAMIC LAYOUT RENDERING
     */
    function renderDashboard(data) {
        // Update document title
        document.title = `SkyFlow | ${data.city}, ${data.country}`;

        // 1. Current Weather Card
        cityNameEl.textContent = data.city;
        countryBadgeEl.textContent = data.country;
        currentDateEl.textContent = data.date;
        currentTempEl.innerHTML = data.temperature;
        feelsLikeTempEl.innerHTML = `${data.feels_like}&deg;C`;
        
        weatherConditionMainEl.textContent = data.condition;
        weatherDescriptionEl.textContent = data.description;
        
        // High quality weather icons from OpenWeatherMap
        weatherIconLgEl.src = `https://openweathermap.org/img/wn/${data.icon}@4x.png`;
        weatherIconLgEl.alt = data.description;
        
        tempMinEl.innerHTML = `${data.temp_min}&deg;C`;
        tempMaxEl.innerHTML = `${data.temp_max}&deg;C`;

        // 2. Metric Cards
        humidityValueEl.textContent = `${data.humidity}%`;
        windValueEl.textContent = `${data.wind_speed} km/h`;
        pressureValueEl.textContent = `${data.pressure} hPa`;
        sunriseValueEl.textContent = data.sunrise;
        sunsetValueEl.textContent = data.sunset;

        // 3. Dynamic Weather Background Changes
        updateWeatherTheme(data.condition);

        // 4. Render Forecast cards
        forecastCardsRow.innerHTML = ""; // Clear existing
        
        data.forecast.forEach((day, index) => {
            const cardCol = document.createElement("div");
            cardCol.className = "col";
            // Stagger animation delays for cards
            const delayClass = `animate-slide-up-delay-${(index % 5) + 1}`;
            
            cardCol.innerHTML = `
                <div class="forecast-card glass-card text-center p-3 h-100 d-flex flex-column align-items-center justify-content-between ${delayClass}">
                    <div>
                        <div class="forecast-day text-truncate w-100">${day.day_name}</div>
                        <div class="forecast-date">${day.date_display}</div>
                    </div>
                    <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" class="forecast-icon my-2">
                    <div>
                        <div class="forecast-temp d-flex justify-content-center gap-2">
                            <span class="forecast-temp-max">${day.temp_max}&deg;</span>
                            <span class="forecast-temp-min">${day.temp_min}&deg;</span>
                        </div>
                        <small class="forecast-desc d-block text-truncate mt-1" title="${day.description}">${day.condition}</small>
                    </div>
                </div>
            `;
            forecastCardsRow.appendChild(cardCol);
        });

        // 5. Display Dashboard contents
        dashboardContent.classList.remove("d-none");
    }

    /**
     * DYNAMIC WEATHER BACKGROUND CLASS UPDATER
     */
    function updateWeatherTheme(condition) {
        // Remove existing weather body backgrounds
        const bodyClasses = Array.from(document.body.classList);
        bodyClasses.forEach(cls => {
            if (cls.startsWith("bg-weather-")) {
                document.body.classList.remove(cls);
            }
        });

        // Map conditions to backgrounds
        const conditionClean = condition.toLowerCase();
        let bgClass = "bg-weather-default";

        if (["clear"].includes(conditionClean)) {
            bgClass = "bg-weather-clear";
        } else if (["clouds"].includes(conditionClean)) {
            bgClass = "bg-weather-clouds";
        } else if (["rain", "drizzle"].includes(conditionClean)) {
            bgClass = "bg-weather-rain";
        } else if (["thunderstorm"].includes(conditionClean)) {
            bgClass = "bg-weather-thunderstorm";
        } else if (["snow"].includes(conditionClean)) {
            bgClass = "bg-weather-snow";
        } else if (["mist", "smoke", "haze", "dust", "fog", "sand", "ash", "squall", "tornado"].includes(conditionClean)) {
            bgClass = "bg-weather-mist";
        }

        document.body.classList.add(bgClass);
    }

    /**
     * LOCAL STORAGE & HISTORY MANAGEMENT
     */
    function getSearchHistory() {
        const history = localStorage.getItem(localStorageHistoryKey);
        return history ? JSON.parse(history) : [];
    }

    function addToSearchHistory(city) {
        if (!city) return;
        
        let history = getSearchHistory();
        
        // Remove city if already exists to move it to the front
        history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
        
        // Add to front of array
        history.unshift(city);
        
        // Cap history to 5 elements
        if (history.length > 5) {
            history = history.slice(0, 5);
        }
        
        localStorage.setItem(localStorageHistoryKey, JSON.stringify(history));
        renderSearchHistory();
    }

    function removeCityFromHistory(city, event) {
        // Prevent trigger parent badge click event
        event.stopPropagation();
        
        let history = getSearchHistory();
        history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
        localStorage.setItem(localStorageHistoryKey, JSON.stringify(history));
        renderSearchHistory();
    }

    function clearSearchHistory() {
        localStorage.removeItem(localStorageHistoryKey);
        renderSearchHistory();
    }

    function renderSearchHistory() {
        const history = getSearchHistory();
        
        if (history.length === 0) {
            searchHistoryContainer.classList.add("d-none");
            historyBadges.innerHTML = "";
            return;
        }

        historyBadges.innerHTML = "";
        
        history.forEach(city => {
            const badge = document.createElement("div");
            badge.className = "badge-history animate-fade-in";
            
            // Format and capitalizes first letter
            const titleCity = city.charAt(0).toUpperCase() + city.slice(1);
            
            badge.innerHTML = `
                <span>${titleCity}</span>
                <button class="btn-remove-history" aria-label="Remove ${titleCity} from history">
                    <i class="bi bi-x-circle-fill"></i>
                </button>
            `;
            
            // Re-fetch weather on badge click
            badge.addEventListener("click", () => {
                fetchWeatherData({ city });
            });
            
            // Delete history item on x click
            const removeBtn = badge.querySelector(".btn-remove-history");
            removeBtn.addEventListener("click", (e) => {
                removeCityFromHistory(city, e);
            });

            historyBadges.appendChild(badge);
        });

        searchHistoryContainer.classList.remove("d-none");
    }

    // Trigger Initial logic
    init();
});
