import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import PhotographerDashboard from './pages/PhotographerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route path="/photographer-dashboard" element={<PhotographerDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* For Photographers static page */}
        <Route path="/for-photographers" element={<Navigate to="/for-photographers.html" replace />} />
        {/* Legacy .html URLs redirect to clean paths */}
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/register.html" element={<Navigate to="/register" replace />} />
        <Route path="/customer-dashboard.html" element={<Navigate to="/customer-dashboard" replace />} />
        <Route path="/photographer-dashboard.html" element={<Navigate to="/photographer-dashboard" replace />} />
        <Route path="/admin-dashboard.html" element={<Navigate to="/admin-dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
