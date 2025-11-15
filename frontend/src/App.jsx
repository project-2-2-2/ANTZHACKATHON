import { Outlet, useNavigate, Link } from 'react-router-dom';
import { setAuthToken } from './services/api';

export default function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthToken(null);
    try { localStorage.removeItem('userId'); } catch (e) {}
    navigate('/');
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      <header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>🔌 EV Charging Station Finder</h1>
        </div>
        <nav>
          <Link to="/" style={{ color: 'white', marginRight: 12, textDecoration: 'none' }}>Home</Link>
          {localStorage.getItem('token') ? (
            <>
              <Link to="/stations" style={{ color: 'white', marginRight: 12, textDecoration: 'none' }}>Stations</Link>
              <Link to="/map" style={{ color: 'white', marginRight: 12, textDecoration: 'none' }}>Map</Link>
              <Link to="/my-bookings" style={{ color: 'white', marginRight: 12, textDecoration: 'none' }}>My Bookings</Link>
              <button onClick={handleLogout} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.16)', padding: '6px 10px', borderRadius: 6 }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', marginRight: 8, textDecoration: 'none' }}>Sign in</Link>
              <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
            </>
          )}
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}
 
