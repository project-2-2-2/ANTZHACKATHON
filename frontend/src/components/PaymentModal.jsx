import { useEffect, useState } from 'react';
import { verifyPayment, cancelPendingBooking } from '../services/api';

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes = 300 seconds
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      // Payment deadline expired
      handleExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleExpire = async () => {
    try {
      await cancelPendingBooking(booking._id);
      setError('Payment deadline expired. Booking has been cancelled.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  const handleCvvChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(v);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await verifyPayment({
        bookingId: booking._id,
        paymentId: booking.paymentId,
        cardNumber,
        cardExpiry,
        cardCvv,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(response.data.data);
        }, 1500);
      } else {
        setError(response.data.message || 'Payment verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isTimeRunningOut = timeRemaining < 60;

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
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 8,
          padding: 30,
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h2 style={{ color: '#1e8e3e', margin: '0 0 8px 0' }}>Payment Successful!</h2>
            <p style={{ color: '#666', margin: 0 }}>Your booking has been confirmed.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Complete Payment</h2>
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

            <div
              style={{
                backgroundColor: isTimeRunningOut ? '#fee' : '#f5f5f5',
                padding: 12,
                borderRadius: 6,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12, color: '#666' }}>Time Remaining</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: isTimeRunningOut ? '#d12b2b' : '#333',
                  marginTop: 4,
                }}
              >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>

            <div style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Booking Details</strong>
              </div>
              <div style={{ color: '#666', lineHeight: 1.6 }}>
                <div>Amount: ₹{booking.amount.toFixed(2)}</div>
                <div>Start: {new Date(booking.startTime).toLocaleString()}</div>
                <div>End: {new Date(booking.endTime).toLocaleString()}</div>
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

            <form onSubmit={handlePayment}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="12/25"
                    maxLength="5"
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
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>CVV</label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    placeholder="123"
                    maxLength="4"
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
              </div>

              <button
                type="submit"
                disabled={loading || timeRemaining <= 0}
                style={{
                  width: '100%',
                  padding: 12,
                  backgroundColor: loading || timeRemaining <= 0 ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading || timeRemaining <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!loading && timeRemaining > 0) {
                    e.target.style.backgroundColor = '#0056b3';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading && timeRemaining > 0) {
                    e.target.style.backgroundColor = '#007bff';
                  }
                }}
              >
                {loading ? 'Processing...' : `Pay ₹${booking.amount.toFixed(2)}`}
              </button>
            </form>

            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                color: '#999',
                textAlign: 'center',
              }}
            >
              Test card: 4532 1111 1111 1111
            </div>
          </>
        )}
      </div>
    </div>
  );
}
