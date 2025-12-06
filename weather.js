// Fetch Vienna weather data
async function fetchViennaWeather() {
    try {
        // Using open-meteo.com (free, no API key needed)
        // Vienna coordinates: 48.2082°N, 16.3738°E
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=48.2082&longitude=16.3738&current_weather=true');
        const data = await response.json();

        const temp = Math.round(data.current_weather.temperature);
        const weatherCode = data.current_weather.weathercode;

        // Map WMO weather codes to readable conditions
        const conditions = {
            0: 'CLEAR',
            1: 'MAINLY CLEAR',
            2: 'PARTLY CLOUDY',
            3: 'OVERCAST',
            45: 'FOGGY',
            48: 'FOGGY',
            51: 'LIGHT DRIZZLE',
            53: 'DRIZZLE',
            55: 'HEAVY DRIZZLE',
            61: 'LIGHT RAIN',
            63: 'RAIN',
            65: 'HEAVY RAIN',
            71: 'LIGHT SNOW',
            73: 'SNOW',
            75: 'HEAVY SNOW',
            77: 'SNOW GRAINS',
            80: 'LIGHT SHOWERS',
            81: 'SHOWERS',
            82: 'HEAVY SHOWERS',
            85: 'LIGHT SNOW SHOWERS',
            86: 'SNOW SHOWERS',
            95: 'THUNDERSTORM',
            96: 'THUNDERSTORM WITH HAIL',
            99: 'HEAVY THUNDERSTORM'
        };

        const condition = conditions[weatherCode] || 'CLOUDY';

        document.getElementById('weather-condition').textContent = condition;
        document.getElementById('weather-temp').textContent = temp;
    } catch (error) {
        console.error('Weather fetch failed:', error);
        document.getElementById('weather-condition').textContent = 'CLOUDY';
        document.getElementById('weather-temp').textContent = '--';
    }
}

// Fetch weather when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchViennaWeather);
} else {
    fetchViennaWeather();
}
