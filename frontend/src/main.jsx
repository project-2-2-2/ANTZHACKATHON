import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App.jsx'
import Login from './components/Login'
import Register from './components/Register'
import Stations from './pages/Stations'
import StationDetails from './pages/StationDetails'
import Landing from './pages/Landing'
import MyBookings from './pages/MyBookings'

function Protected({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route path="stations" element={<Protected><Stations /></Protected>} />
        <Route path="station/:id" element={<Protected><StationDetails /></Protected>} />
        <Route path="my-bookings" element={<Protected><MyBookings /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
