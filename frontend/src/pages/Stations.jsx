import { useEffect, useState } from 'react';
import { getNearbyStations } from '../services/api';
import { Link } from 'react-router-dom';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNearby = async (lat, lng) => {
      try {
        const res = await getNearbyStations(lat, lng, 25);
        setStations(res.data.data || res.data || []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load nearby stations');
      } finally {
        setLoading(false);
      }
    };

    if (!navigator.geolocation) {
      setError('Geolocation not supported in your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.error(err);
        setError('Location permission denied or unavailable');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading nearby stations...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Nearby Stations</h2>
      {stations.length === 0 && <div>No stations found nearby.</div>}

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 12 }}>
        {stations.map((s) => {
          const loc = s.location;
          const locText = loc && typeof loc === 'object' ? `${loc.lat?.toFixed(5) || ''}, ${loc.lng?.toFixed(5) || ''}` : (s.address || loc || '');
          const distanceText = s.distance != null ? `${s.distance} km` : '';
          const hours = s.openingHours ? `${s.openingHours.open || ''} - ${s.openingHours.close || ''}` : '';

          return (
            <div key={s._id || s.id} style={{ background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginTop: 0 }}>{s.name || s.title || 'Station'}</h3>
              <p style={{ margin: '6px 0', color: '#374151', fontSize: 14 }}>{locText}</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                {distanceText && <span style={{ fontSize: 13, color: '#6b7280' }}>{distanceText}</span>}
                {hours && <span style={{ fontSize: 13, color: '#6b7280' }}>Hours: {hours}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Link to={`/station/${s._id || s.id}`} style={{ padding: '8px 10px', background: '#667eea', color: 'white', borderRadius: 6, textDecoration: 'none' }}>View</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
