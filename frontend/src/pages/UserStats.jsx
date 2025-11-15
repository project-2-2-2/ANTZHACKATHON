import { useEffect, useState } from 'react';
import { getUserStats } from '../services/api';

export default function UserStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setError('User ID not found');
          setLoading(false);
          return;
        }

        const res = await getUserStats(userId);
        setStats(res.data.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load user stats');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        Loading your stats...
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

  if (!stats) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
        No stats available
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: 30, color: '#333' }}>Your Charging Statistics</h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
            marginBottom: 40,
          }}
        >
          {/* Total Bookings Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            }}
          >
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Total Bookings</div>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>{stats.totalBookings}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
              {stats.cancelledBookingsCount} cancelled
            </div>
          </div>

          {/* Total Hours Booked Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)',
            }}
          >
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Total Hours Charged</div>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>
              {stats.totalHoursBooked.toFixed(2)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>hours</div>
          </div>

          {/* Total Money Spent Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
            }}
          >
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Total Amount Spent</div>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>₹{stats.moneySpent.toFixed(2)}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>total</div>
          </div>

          {/* Active Bookings Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e8e3e 0%, #2db359 100%)',
              color: 'white',
              padding: 24,
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(30, 142, 62, 0.3)',
            }}
          >
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Active Bookings</div>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>
              {stats.totalBookings - stats.cancelledBookingsCount}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>active or completed</div>
          </div>
        </div>

        {/* Summary Section */}
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 16, color: '#333', fontSize: 18 }}>
            Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Booking Status</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                {((stats.totalBookings - stats.cancelledBookingsCount) / (stats.totalBookings || 1) * 100).toFixed(1)}%
                {' '}
                success rate
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Average Session</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                {stats.totalBookings > 0
                  ? (stats.totalHoursBooked / (stats.totalBookings - stats.cancelledBookingsCount) || 0).toFixed(2)
                  : 0}
                {' '}
                hours
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Avg Cost per Hour</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                ₹
                {stats.totalHoursBooked > 0
                  ? (stats.moneySpent / stats.totalHoursBooked).toFixed(2)
                  : 0}
              </div>
            </div>
          </div>
        </div>

        {/* No Bookings Message */}
        {stats.totalBookings === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: 12,
              color: '#92400e',
              marginTop: 20,
            }}
          >
            <p>You haven't made any bookings yet. Start by finding a nearby charging station!</p>
          </div>
        )}
      </div>
    </div>
  );
}
