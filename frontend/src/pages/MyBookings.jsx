import { useEffect, useState } from 'react';
import { getUserBookings, cancelUserBooking } from '../services/api';

export default function MyBookings() {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [previousBookings, setPreviousBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

      if (!userId) {
        setError('Please log in to view your bookings');
        setLoading(false);
        return;
      }

      const response = await getUserBookings(userId);
      if (response.data.success) {
        setUpcomingBookings(response.data.data.upcoming || []);
        setPreviousBookings(response.data.data.previous || []);
      } else {
        setError(response.data.message || 'Failed to load bookings');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const response = await cancelUserBooking(bookingId);

      if (response.data.success) {
        setSuccessMessage(
          `Booking cancelled successfully. ${response.data.data.refund.policy}`
        );

        // Reload bookings
        setTimeout(() => {
          setSuccessMessage(null);
          loadBookings();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const BookingCard = ({ booking, isUpcoming }) => (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#999' }}>Station</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
            {booking.stationId?.name || 'Unknown'}
          </div>
          {booking.stationId?.address && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {booking.stationId.address}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#999' }}>Charger</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
            {booking.chargerId?.connectorType || booking.chargerId?.type || 'Unknown'} -{' '}
            {booking.chargerId?.capacity || '—'}kW
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#999' }}>Start</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{formatDateTime(booking.startTime)}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#999' }}>End</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{formatDateTime(booking.endTime)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: '#999' }}>Amount</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: '#1e8e3e' }}>
            ₹{booking.amount.toFixed(2)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: '#999' }}>Status</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginTop: 4,
              color:
                booking.bookingStatus === 'booked'
                  ? '#007bff'
                  : booking.bookingStatus === 'cancelled'
                    ? '#d12b2b'
                    : '#999',
            }}
          >
            {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
          </div>
        </div>
      </div>

      {isUpcoming && booking.bookingStatus !== 'cancelled' && (
        <button
          onClick={() => handleCancelBooking(booking._id)}
          disabled={cancellingId === booking._id}
          style={{
            width: '100%',
            padding: 10,
            backgroundColor: cancellingId === booking._id ? '#ccc' : '#d12b2b',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
            cursor: cancellingId === booking._id ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            if (cancellingId !== booking._id) {
              e.target.style.backgroundColor = '#a01f23';
            }
          }}
          onMouseOut={(e) => {
            if (cancellingId !== booking._id) {
              e.target.style.backgroundColor = '#d12b2b';
            }
          }}
        >
          {cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div>Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      }}
    >
      <h1 style={{ margin: '0 0 24px 0', fontSize: 28 }}>My Bookings</h1>

      {error && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#fee',
            color: '#d12b2b',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: 12,
            backgroundColor: '#efe',
            color: '#1e8e3e',
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {/* Upcoming Bookings */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16, borderBottom: '2px solid #1e8e3e', paddingBottom: 8 }}>
          Upcoming Bookings ({upcomingBookings.length})
        </h2>

        {upcomingBookings.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              color: '#666',
            }}
          >
            No upcoming bookings. <a href="/stations" style={{ color: '#007bff', textDecoration: 'none' }}>Book a station</a>
          </div>
        ) : (
          upcomingBookings.map((booking) => <BookingCard key={booking._id} booking={booking} isUpcoming={true} />)
        )}
      </section>

      {/* Previous Bookings */}
      <section>
        <h2 style={{ fontSize: 20, marginBottom: 16, borderBottom: '2px solid #999', paddingBottom: 8 }}>
          Previous Bookings ({previousBookings.length})
        </h2>

        {previousBookings.length === 0 ? (
          <div
            style={{
              padding: 20,
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
              color: '#666',
            }}
          >
            No previous bookings yet.
          </div>
        ) : (
          previousBookings.map((booking) => <BookingCard key={booking._id} booking={booking} isUpcoming={false} />)
        )}
      </section>
    </div>
  );
}
