import { useEffect, useState, useRef } from 'react';
import { getNearbyStations } from '../services/api';

export default function MapLoc() {
  const [userLocation, setUserLocation] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Load Google Maps API script
    const apiKey = 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => initializeMap();
      script.onerror = () => setError('Failed to load Google Maps');
    } else {
      initializeMap();
    }
  }, [userLocation, stations]);

  // Get user location and fetch nearby stations
  useEffect(() => {
    const fetchLocation = async (lat, lng) => {
      try {
        setUserLocation({ lat, lng });

        const res = await getNearbyStations(lat, lng, 25);
        const stationsData = res.data.data || res.data || [];
        setStations(stationsData);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load nearby stations');
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      setError('Geolocation not supported in your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.error(err);
        setError('Location permission denied or unavailable');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !userLocation || !window.google) return;

    // Clear previous markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Initialize map
    const mapOptions = {
      zoom: 13,
      center: { lat: userLocation.lat, lng: userLocation.lng },
      mapTypeId: 'roadmap',
    };

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    } else {
      mapInstanceRef.current.setCenter(mapOptions.center);
      mapInstanceRef.current.setZoom(mapOptions.zoom);
    }

    // Add user location marker (blue)
    const userMarker = new window.google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: mapInstanceRef.current,
      title: 'Your Location',
      icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    });
    markersRef.current.push(userMarker);

    // Add station markers (green)
    stations.forEach((station) => {
      if (station.location) {
        const lat = station.location.lat || station.location.coordinates?.[1];
        const lng = station.location.lng || station.location.coordinates?.[0];
        if (lat && lng) {
          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: station.name,
            icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: Arial, sans-serif;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px;">${station.name}</h3>
                <p style="margin: 4px 0; font-size: 12px; color: #666;">${station.address || 'Address not available'}</p>
                <p style="margin: 4px 0; font-size: 12px; color: #1e8e3e;"><strong>${station.distance?.toFixed(1) || '?'} km away</strong></p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            // Close all other info windows
            infoWindow.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
        }
      }
    });
  };

  const showStationPopup = (station, x, y) => {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      font-size: 13px;
      max-width: 200px;
    `;
    popup.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 6px;">${station.name}</div>
      <div style="color: #666; margin-bottom: 4px;">${station.address || 'Address not available'}</div>
      <div style="color: #999; font-size: 12px;">Distance: ${station.distance?.toFixed(1) || '?'} km</div>
      <button onclick="this.parentElement.remove()" style="margin-top: 8px; padding: 4px 8px; background: #1e8e3e; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">Close</button>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.remove(), 5000);
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        Loading map and nearby stations...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: '#d12b2b', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          flex: 1,
          position: 'relative',
          borderBottom: '1px solid #e0e0e0',
          overflow: 'auto',
        }}
      />

      {/* Legend and Info Panel */}
      <div style={{ padding: 16, backgroundColor: '#f9f9f9', borderTop: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#007bff',
              }}
            />
            <span style={{ fontSize: 13 }}>Your Location</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#1e8e3e',
              }}
            />
            <span style={{ fontSize: 13 }}>Charging Station</span>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#666' }}>
          Found <strong>{stations.length}</strong> charging station{stations.length !== 1 ? 's' : ''} nearby within 25 km
        </div>
      </div>

      {/* Stations List */}
      <div
        style={{
          maxHeight: 200,
          overflowY: 'auto',
          padding: 12,
          backgroundColor: '#fff',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#666' }}>
          NEARBY STATIONS ({stations.length})
        </div>
        {stations.map((station) => (
          <div
            key={station._id}
            style={{
              padding: 8,
              marginBottom: 6,
              borderRadius: 4,
              backgroundColor: '#f5f5f5',
              borderLeft: '3px solid #1e8e3e',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#efefef')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{station.name}</div>
            <div style={{ color: '#666', fontSize: 11 }}>
              {station.address || 'Address not available'}
            </div>
            <div style={{ color: '#1e8e3e', fontSize: 11, marginTop: 2, fontWeight: 500 }}>
              {station.distance?.toFixed(1) || '?'} km away
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
