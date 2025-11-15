import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStationById } from '../services/api';

export default function StationDetails() {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [chargingPoints, setChargingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getStationById(id);
        const respData = res?.data ?? {};
        const payload = respData.data ?? respData;
        const stationObj = payload.station ?? payload;
        const connectors =
          payload.chargingPoints ??
          payload.connectors ??
          payload.ports ??
          [];

        setStation(stationObj || null);
        setChargingPoints(Array.isArray(connectors) ? connectors : []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Failed to load station');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div style={{ padding: 20 }}>Loading station...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;
  if (!station) return <div style={{ padding: 20 }}>Station not found</div>;

  const renderLocation = (st) => {
    if (!st) return '';
    if (st.location && (st.location.lat != null || st.location.lng != null)) {
      const lat = st.location.lat ?? (st.location.coordinates && st.location.coordinates[1]);
      const lng = st.location.lng ?? (st.location.coordinates && st.location.coordinates[0]);
      if (lat != null && lng != null) return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
    return st.address || st.location || '';
  };

  const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'free':
        return '#1e8e3e'; // green
      case 'booked':
        return '#e07b1a'; // orange
      case 'in_use':
      case 'in-use':
        return '#d12b2b'; // red
      default:
        return '#666';
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-GB'); // DD/MM/YYYY, hh:mm:ss
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <h2 style={{ margin: 0, fontSize: 22 }}>{station.name || 'Station'}</h2>

      <div style={{ marginTop: 8, color: '#444' }}>
        <div style={{ marginBottom: 6 }}>{renderLocation(station)}</div>
        {station.openingHours && (
          <div style={{ fontSize: 14 }}>
            <strong>Opening hours:</strong>{' '}
            <span>{`${station.openingHours.open ?? '00:00'} — ${station.openingHours.close ?? '23:59'}`}</span>
          </div>
        )}
      </div>

      <section style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 16 }}>Connectors ({chargingPoints.length})</strong>
          {/* optional: show station price */}
          {typeof station.price === 'number' && (
            <div style={{ fontSize: 14, color: '#333' }}>Avg price: ₹{station.price.toFixed(2)}</div>
          )}
        </div>

        {chargingPoints.length === 0 ? (
          <div style={{ marginTop: 12 }}>No connectors found for this station.</div>
        ) : (
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {chargingPoints.map((c) => (
              <article
                key={c._id ?? `${c.connectorType}-${c.capacity}-${Math.random()}`}
                style={{
                  border: '1px solid #e6e6e6',
                  borderRadius: 8,
                  padding: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{c.connectorType ?? c.type ?? 'Unknown'}</div>
                  <span
                    style={{
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: `${statusColor(c.availabilityStatus)}22`,
                      color: statusColor(c.availabilityStatus),
                      border: `1px solid ${statusColor(c.availabilityStatus)}33`,
                    }}
                  >
                    {c.availabilityStatus ?? 'free'}
                  </span>
                </div>

                <div style={{ marginTop: 8, fontSize: 14 }}>
                  <div>
                    <strong>Capacity:</strong> {c.capacity ?? '—'} kW
                  </div>
                  {c._id && (
                    <div style={{ marginTop: 6, color: '#666', fontSize: 12 }}>
                      <span>id: {c._id}</span>
                      {c.createdAt && <span style={{ marginLeft: 8 }}>• added {formatDate(c.createdAt)}</span>}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <details style={{ marginTop: 18, maxWidth: '100%' }}>
        <summary style={{ cursor: 'pointer' }}>Raw station JSON (debug)</summary>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 300,
            overflow: 'auto',
            background: '#0f1724',
            color: '#e6eef8',
            padding: 12,
            borderRadius: 6,
            marginTop: 8,
          }}
        >
        </pre>
      </details>
    </div>
  );
}
