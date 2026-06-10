import { useState, useEffect } from 'react';

function Navbar() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; };
  return (
    <header className="navbar">
      <div className="navbar-left"><span className="logo-text">SnapBook</span></div>
      <div className="navbar-right">
        {token && user ? (
          <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
        ) : (
          <><a href="/login" className="btn btn-navbar-ghost">Login</a><a href="/register" className="btn btn-primary">Sign Up</a></>
        )}
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="sk-footer">
      <div className="sk-footer-inner">
        <div className="sk-footer-col sk-footer-brand">
          <div className="sk-footer-logo"><span>SnapBook</span></div>
          <p className="sk-footer-tagline">The sketchbook for your most important moments.</p>
        </div>
      </div>
      <div className="sk-footer-bottom">&copy; 2024 SnapBook. All rights reserved.</div>
    </footer>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { document.title = 'Login - SnapBook'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        if (data.user.role === 'customer') window.location.href = '/customer-dashboard';
        else if (data.user.role === 'photographer') window.location.href = '/photographer-dashboard';
        else window.location.href = '/admin-dashboard';
      }, 1000);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="page auth-page">
        <section className="auth-card">
          <h1>Sign In</h1>
          <p className="subtext">Welcome back to SnapBook</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-label">Email<input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label className="form-label">Password<input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required /></label>
            <button type="submit" className="btn btn-primary btn-full">Sign In</button>
            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}
          </form>
          <p className="auth-switch">Don&apos;t have an account? <a href="/register">Sign Up</a></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
