const API_KEY = 'demo'; // Replace with your OpenWeatherMap API key from https://openweathermap.org/api
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const searchInput = document.getElementById('searchInput');
const errorMessage = document.getElementById('errorMessage');
const weatherContainer = document.getElementById('weatherContainer');

// Weather icon mapping
const weatherIcons = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️'
};

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
  setTimeout(() => errorMessage.classList.remove('show'), 5000);
}

function getWeatherIcon(iconCode) {
  return weatherIcons[iconCode] || '🌤️';
}

async function fetchWeather(lat, lon) {
  try {
    if (API_KEY === 'demo') {
      showError('Please add your OpenWeatherMap API key to script.js to use this app');
      return;
    }

    // Fetch current weather
    const weatherResponse = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error('City not found');
    }

    const weather = await weatherResponse.json();

    // Fetch forecast
    const forecastResponse = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const forecast = await forecastResponse.json();

    displayCurrentWeather(weather);
    displayForecast(forecast);
    errorMessage.classList.remove('show');
  } catch (error) {
    showError(error.message || 'Failed to fetch weather data');
  }
}

function displayCurrentWeather(data) {
  const {
    name,
    sys: { country },
    main: { temp, feels_like, humidity, pressure },
    weather: [{ main, description, icon }],
    wind: { speed },
    clouds: { all },
    visibility
  } = data;

  document.getElementById('cityName').textContent = `${name}, ${country}`;
  document.getElementById('weatherDesc').textContent = description;
  document.getElementById('temperature').textContent = Math.round(temp);
  document.getElementById('feelsLike').textContent = `${Math.round(feels_like)}°C`;
  document.getElementById('humidity').textContent = `${humidity}%`;
  document.getElementById('windSpeed').textContent = `${speed.toFixed(1)} m/s`;
  document.getElementById('pressure').textContent = `${pressure} hPa`;
  document.getElementById('uvIndex').textContent = `${all}%`;
  document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;
  document.getElementById('weatherIcon').textContent = getWeatherIcon(icon);
}

function displayForecast(data) {
  const forecastList = data.list;
  const dailyForecasts = {};

  // Group by day
  forecastList.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!dailyForecasts[day]) {
      dailyForecasts[day] = item;
    }
  });

  const forecastContainer = document.getElementById('forecast');
  forecastContainer.innerHTML = '';

  Object.entries(dailyForecasts)
    .slice(0, 5)
    .forEach(([day, item]) => {
      const card = document.createElement('div');
      card.className = 'forecast-card';
      card.innerHTML = `
        <div class="date">${day}</div>
        <div class="icon">${getWeatherIcon(item.weather[0].icon)}</div>
        <div class="temp">${Math.round(item.main.temp)}°C</div>
        <div class="desc">${item.weather[0].description}</div>
      `;
      forecastContainer.appendChild(card);
    });
}

async function searchCity() {
  const city = searchInput.value.trim();
  if (!city) {
    showError('Please enter a city name');
    return;
  }

  try {
    if (API_KEY === 'demo') {
      showError('Please add your OpenWeatherMap API key to script.js');
      return;
    }

    const response = await fetch(
      `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error('City not found. Try another search.');
    }

    const data = await response.json();
    fetchWeather(data.coord.lat, data.coord.lon);
  } catch (error) {
    showError(error.message);
  }
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords;
      fetchWeather(latitude, longitude);
    },
    error => {
      showError('Unable to access your location. Please enable location services.');
    }
  );
}

// Allow Enter key to search
searchInput.addEventListener('keypress', event => {
  if (event.key === 'Enter') {
    searchCity();
  }
});

// Initialize with default city (London)
if (API_KEY !== 'demo') {
  searchInput.value = 'London';
  searchCity();
}