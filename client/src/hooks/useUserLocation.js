import { useState, useEffect } from 'react';

// Returns { coords: {lat, lng} | null, status: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' }
export default function useUserLocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      (err) => {
        console.warn('[useUserLocation] denied/failed:', err.message);
        setStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { coords, status };
}