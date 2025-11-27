
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, MapPin, RefreshCw, Navigation } from 'lucide-react';

interface WeatherData {
    temperature: number;
    windspeed: number;
    humidity: number;
    weathercode: number;
}

export const Weather: React.FC = () => {
    const [data, setData] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [locationName, setLocationName] = useState('LOCAL SECTOR');
    const [error, setError] = useState<string | null>(null);

    const fetchWeather = async () => {
        setLoading(true);
        setError(null);
        
        if (!navigator.geolocation) {
            setError('GEOLOCATION SENSOR OFFLINE');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                // Open-Meteo API (No Key Required)
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
                const json = await res.json();
                
                setData({
                    temperature: json.current.temperature_2m,
                    windspeed: json.current.wind_speed_10m,
                    humidity: json.current.relative_humidity_2m,
                    weathercode: json.current.weather_code
                });
                setLoading(false);
            } catch (e) {
                setError('DATA UPLINK FAILED');
                setLoading(false);
            }
        }, () => {
            setError('POSITION ACQUISITION DENIED');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun size={64} />;
        if (code <= 3) return <Cloud size={64} />;
        if (code <= 67) return <CloudRain size={64} />;
        return <CloudRain size={64} />; // Default
    };

    const getConditionText = (code: number) => {
        if (code === 0) return "CLEAR SKY";
        if (code <= 3) return "OVERCAST";
        if (code <= 48) return "FOG";
        if (code <= 67) return "RAIN";
        if (code <= 77) return "SNOW";
        if (code <= 82) return "HEAVY RAIN";
        return "STORM";
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="w-full h-full pt-24 px-6 md:px-12 pb-12 max-w-7xl mx-auto flex flex-col"
        >
            <div className="flex justify-between items-end mb-8 border-b-2 border-white pb-6">
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter mb-2">Atmospherics</h1>
                    <p className="text-sm md:text-base uppercase tracking-widest opacity-70">Environmental Sensors & Forecast</p>
                </div>
                <button 
                    onClick={fetchWeather} 
                    className={`flex items-center gap-2 border-2 border-white px-4 py-2 font-bold uppercase hover:bg-white hover:text-blue-base transition-all text-xs tracking-widest ${loading ? 'animate-pulse' : ''}`}
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Scanning...' : 'Refresh'}
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                {error ? (
                    <div className="border-4 border-red-500 p-8 text-center text-red-300">
                        <div className="text-2xl font-bold uppercase mb-2">Sensor Error</div>
                        <div className="font-mono">{error}</div>
                        <button onClick={fetchWeather} className="mt-6 border border-red-300 px-4 py-2 uppercase font-bold hover:bg-red-500 hover:text-white">Retry Uplink</button>
                    </div>
                ) : data ? (
                    <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* MAIN DISPLAY */}
                        <div className="border-4 border-white p-8 flex flex-col items-center justify-center text-center bg-white/5 relative overflow-hidden">
                             <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60">
                                 <MapPin size={14} /> {locationName}
                             </div>
                             
                             <div className="mb-6 animate-pulse">
                                 {getWeatherIcon(data.weathercode)}
                             </div>
                             
                             <div className="text-8xl font-bold font-mono tracking-tighter mb-2">
                                 {data.temperature}°<span className="text-4xl">C</span>
                             </div>
                             
                             <div className="text-2xl font-bold uppercase tracking-[0.2em]">{getConditionText(data.weathercode)}</div>
                        </div>

                        {/* TELEMETRY GRID */}
                        <div className="grid grid-rows-3 gap-6">
                             {/* WIND */}
                             <div className="border-2 border-white p-6 flex items-center justify-between hover:bg-white hover:text-blue-base transition-colors group">
                                 <div className="flex items-center gap-4">
                                     <Wind size={32} />
                                     <div className="text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Wind Velocity</div>
                                 </div>
                                 <div className="text-3xl font-mono font-bold">{data.windspeed} <span className="text-sm">km/h</span></div>
                             </div>

                             {/* HUMIDITY */}
                             <div className="border-2 border-white p-6 flex items-center justify-between hover:bg-white hover:text-blue-base transition-colors group">
                                 <div className="flex items-center gap-4">
                                     <Droplets size={32} />
                                     <div className="text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Humidity</div>
                                 </div>
                                 <div className="text-3xl font-mono font-bold">{data.humidity} <span className="text-sm">%</span></div>
                             </div>

                             {/* COORDINATES MOCK */}
                             <div className="border-2 border-white p-6 flex items-center justify-between hover:bg-white hover:text-blue-base transition-colors group">
                                 <div className="flex items-center gap-4">
                                     <Navigation size={32} />
                                     <div className="text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Sector</div>
                                 </div>
                                 <div className="text-lg font-mono font-bold tracking-widest">N 34° W 118°</div>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center opacity-50 animate-pulse uppercase tracking-widest">
                        Initializing Meteorological Uplink...
                    </div>
                )}
            </div>
        </motion.div>
    );
};
