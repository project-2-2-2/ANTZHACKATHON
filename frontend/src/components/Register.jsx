import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, setAuthToken } from '../services/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerUser({ email, username, password });
      if (res.data && res.data.success) {
        const token = res.data.data.token;
        setAuthToken(token);
        try { localStorage.setItem('userId', res.data.data.user._id); } catch(e){}
        navigate('/stations');
      } else {
        alert(res.data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Registration error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: 24, background: 'white', borderRadius: 8, boxShadow: '0 6px 30px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 8 }}>Create account</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, background: '#667eea', color: 'white', border: 'none', borderRadius: 6 }}>
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <span>Already have an account? </span>
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
