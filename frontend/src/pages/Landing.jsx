import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to stations page
      navigate('/stations');
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ maxWidth: 720, width: '100%', background: 'white', padding: 28, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <h1 style={{ marginTop: 0 }}>Welcome to EV Charging Station Finder</h1>
        <p>Find nearby charging stations quickly. Sign in or create an account to continue.</p>

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <Link to="/login" style={{ padding: '10px 14px', background: '#667eea', color: 'white', borderRadius: 6, textDecoration: 'none' }}>Sign in</Link>
          <Link to="/register" style={{ padding: '10px 14px', background: '#e2e8f0', color: '#111827', borderRadius: 6, textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>
    </div>
  );
}
