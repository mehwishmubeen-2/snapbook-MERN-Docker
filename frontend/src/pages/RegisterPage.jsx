import { useState, useEffect } from 'react';

function Navbar() {
  const token = localStorage.getItem('token');
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'; };
  return (
    <header className="navbar">
      <div className="navbar-left"><span className="logo-text">SnapBook</span></div>
      <div className="navbar-right">
        {token ? (
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

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { document.title = 'Register - SnapBook'; }, []);

  const roleHint = role === 'photographer'
    ? 'As a photographer, your account will need admin approval before it\'s public.'
    : 'As a customer, you can immediately start booking photographers.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), password: password.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Registration failed'); return; }
      setSuccess(role === 'photographer'
        ? 'Registered as photographer. Please wait for admin approval.'
        : 'Registered successfully! You can now login.');
      setTimeout(() => { window.location.href = '/login'; }, 1500);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <Navbar />
      <main className="page auth-page">
        <section className="auth-card">
          <h1>Create your account</h1>
          <p className="subtext">Sign up as a customer or photographer.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-label">Name<input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required /></label>
            <label className="form-label">Email<input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label className="form-label">Phone (optional)<input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} /></label>
            <label className="form-label">Password<input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required /></label>
            <label className="form-label">
              Role
              <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="customer">Customer</option>
                <option value="photographer">Photographer</option>
              </select>
            </label>
            <p className="subtext">{roleHint}</p>
            <button type="submit" className="btn btn-primary btn-full">Sign Up</button>
            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}
          </form>
          <p className="auth-switch">Already have an account? <a href="/login">Login</a></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
