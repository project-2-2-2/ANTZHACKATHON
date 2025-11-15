import { useState } from 'react';
import { initiateBooking } from '../services/api';

export default function BookingModal({ station, charger, userId, onClose, onBookingInitiated }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInitiateBooking = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!startTime || !endTime) {
        setError('Please select both start and end times');
        setLoading(false);
        return;
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (end <= start) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      if (start < new Date()) {
        setError('Start time cannot be in the past');
        setLoading(false);
        return;
      }

      const response = await initiateBooking({
        stationId: station._id,
        chargerId: charger._id,
        userId,
        startTime,
        endTime,
      });

      if (response.data.success) {
        onBookingInitiated(response.data.data.booking);
      } else {
        setError(response.data.message || 'Failed to initiate booking');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to initiate booking');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date().toISOString().slice(0, 16);
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 30,
          maxWidth: 450,
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Select Booking Time</h2>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Station:</strong> {station.name}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Connector:</strong> {charger.connectorType || charger.type || 'Unknown'} - {charger.capacity}kW
          </div>
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ color: charger.availabilityStatus === 'free' ? '#1e8e3e' : '#e07b1a' }}>
              {charger.availabilityStatus || 'Free'}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: '#d12b2b',
              backgroundColor: '#fee',
              padding: 10,
              borderRadius: 4,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleInitiateBooking}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                // Auto-set end time to 1 hour later if not set
                if (!endTime && e.target.value) {
                  const start = new Date(e.target.value);
                  const end = new Date(start.getTime() + 60 * 60 * 1000);
                  setEndTime(end.toISOString().slice(0, 16));
                }
              }}
              min={now}
              max={maxDate}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={startTime || now}
              max={maxDate}
              disabled={loading || !startTime}
              required
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 14,
                boxSizing: 'border-box',
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          {startTime && endTime && (
            <div style={{ backgroundColor: '#f0f7ff', padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 13 }}>
              <strong>Duration:</strong>{' '}
              {(() => {
                const start = new Date(startTime);
                const end = new Date(endTime);
                const hours = (end - start) / (1000 * 60 * 60);
                const estimatedCost = Math.round(hours * 100 * 100) / 100;
                return `${hours.toFixed(1)} hours - Estimated: ₹${estimatedCost.toFixed(2)}`;
              })()}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !startTime || !endTime}
            style={{
              width: '100%',
              padding: 12,
              backgroundColor: loading || !startTime || !endTime ? '#ccc' : '#1e8e3e',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !startTime || !endTime ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              if (!loading && startTime && endTime) {
                e.target.style.backgroundColor = '#1a6b2f';
              }
            }}
            onMouseOut={(e) => {
              if (!loading && startTime && endTime) {
                e.target.style.backgroundColor = '#1e8e3e';
              }
            }}
          >
            {loading ? 'Creating Booking...' : 'Continue to Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
