import { useState, useEffect, useRef } from 'react';
import Chatbot from '../components/Chatbot.jsx';

// ===== NAVBAR =====
function Navbar({ current }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="logo-text">SnapBook</span>
        <nav className="nav-links">
          <a href="/" className={'nav-link' + (current === 'home' ? ' active' : '')}>Find Photographers</a>
          <a href="/for-photographers.html" className={'nav-link' + (current === 'for-photographers' ? ' active' : '')}>Become a Seller (Photographer)</a>
        </nav>
      </div>
      <div className="navbar-right">
        {token && user ? (
          <div className="navbar-auth">
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">({user.role})</span>
            </div>
            {user.role === 'customer' && (
              <>
                <a href="/customer-dashboard" className="nav-icon" title="Shopping Cart">Cart</a>
                <a href="/customer-dashboard" className="nav-icon" title="Wishlist">Wishlist</a>
                <a href="/customer-dashboard" className="nav-icon" title="My Dashboard">Dashboard</a>
              </>
            )}
            {user.role === 'photographer' && (
              <a href="/photographer-dashboard" className="nav-icon" title="Photographer Dashboard">Dashboard</a>
            )}
            {user.role === 'admin' && (
              <a href="/admin-dashboard" className="nav-icon" title="Admin Dashboard">Admin</a>
            )}
            <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
          </div>
        ) : (
          <>
            <a href="/login" className="btn btn-navbar-ghost">Login</a>
            <a href="/register" className="btn btn-primary">Sign Up</a>
          </>
        )}
      </div>
    </header>
  );
}

// ===== FOOTER =====
function Footer() {
  return (
    <footer className="sk-footer">
      <div className="sk-footer-inner">
        <div className="sk-footer-col sk-footer-brand">
          <div className="sk-footer-logo">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <path d="M5 16 L5 40 C5 41.5 6.5 43 8 43 L40 43 C41.5 43 43 41.5 43 40 L43 16 C43 14.5 41.5 13 40 13 L8 13 C6.5 13 5 14.5 5 16 Z" stroke="#FDFBF7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="24" cy="28" r="8" stroke="#FDFBF7" strokeWidth="2.2"/>
              <circle cx="24" cy="28" r="3" stroke="#D84315" strokeWidth="1.8"/>
              <path d="M18 13 L20 7 L28 7 L30 13" stroke="#FDFBF7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>SnapBook</span>
          </div>
          <p className="sk-footer-tagline">The sketchbook for your most important moments.</p>
        </div>
        <div className="sk-footer-col">
          <h4>For Clients</h4>
          <a href="#">Browse Photographers</a>
          <a href="#">How It Works</a>
          <a href="/register">Create Account</a>
          <a href="/login">Sign In</a>
        </div>
        <div className="sk-footer-col">
          <h4>For Photographers</h4>
          <a href="/register">Join SnapBook</a>
          <a href="/photographer-dashboard">Dashboard</a>
          <a href="#">Pricing</a>
          <a href="#">Success Stories</a>
        </div>
        <div className="sk-footer-col">
          <h4>Contact</h4>
          <a href="mailto:support@snapbook.com">support@snapbook.com</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Centre</a>
        </div>
      </div>
      <div className="sk-footer-bottom">&copy; 2024 SnapBook. All rights reserved.</div>
    </footer>
  );
}

// ===== CATEGORY ICONS =====
function CategoryIcon({ name, color }) {
  if (name === 'Weddings') return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="17" cy="28" r="10" stroke={color} strokeWidth="2.5"/>
      <circle cx="31" cy="28" r="10" stroke={color} strokeWidth="2.5" strokeDasharray="3 1.5"/>
      <path d="M24 17 C24 17 21 12 17 14 C13 16 13 20 17 22 C20 23.5 24 26 24 26 C24 26 28 23.5 31 22 C35 20 35 16 31 14 C27 12 24 17 24 17Z" fill={color} opacity="0.25" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="17" cy="17" r="2" fill={color} opacity="0.7"/>
    </svg>
  );
  if (name === 'Portraits') return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="36" height="36" rx="3" stroke={color} strokeWidth="2.5"/>
      <rect x="10" y="10" width="28" height="28" rx="2" fill={color} opacity="0.08"/>
      <circle cx="24" cy="21" r="7" stroke={color} strokeWidth="2"/>
      <path d="M11 42 C13 33 18 29 24 29 C30 29 35 33 37 42" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'Corporate') return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="10" width="30" height="32" rx="2" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.06"/>
      <path d="M9 20 L39 20M9 30 L39 30" stroke={color} strokeWidth="1.5" opacity="0.5"/>
      <rect x="20" y="36" width="8" height="6" stroke={color} strokeWidth="2"/>
      <rect x="13" y="14" width="4" height="4" rx="1" fill={color} opacity="0.5"/>
      <rect x="22" y="14" width="4" height="4" rx="1" fill={color} opacity="0.5"/>
      <rect x="31" y="14" width="4" height="4" rx="1" fill={color} opacity="0.5"/>
      <rect x="13" y="24" width="4" height="4" rx="1" fill={color} opacity="0.5"/>
      <rect x="22" y="24" width="4" height="4" rx="1" fill={color} opacity="0.5"/>
      <rect x="31" y="24" width="4" height="4" rx="1" fill={color} opacity="0.5"/>
    </svg>
  );
  if (name === 'Fashion') return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 5 C22 5 20 7 20 9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 9 C26 7 26 5 24 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 9 L10 20 L17 22 L11 43 L37 43 L31 22 L38 20 L28 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.12"/>
      <path d="M20 9 C20 9 22 13 24 13 C26 13 28 9 28 9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  if (name === 'Events') return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 20 L7 42 C7 43.5 8.5 45 10 45 L38 45 C39.5 45 41 43.5 41 42 L41 20 C41 18.5 39.5 17 38 17 L10 17 C8.5 17 7 18.5 7 20Z" stroke={color} strokeWidth="2.5" fill={color} fillOpacity="0.08"/>
      <circle cx="24" cy="31" r="7" stroke={color} strokeWidth="2"/>
      <circle cx="24" cy="31" r="3" fill={color} opacity="0.5"/>
      <path d="M18 17 L20 11 L28 11 L30 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="36" cy="22" r="2.5" fill={color}/>
      <path d="M14 6 L15 10M20 4 L20 8M26 4 L27 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
  if (name === 'Family') return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 22 L24 7 L41 22 L41 44 L7 44Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.1"/>
      <path d="M18 44 L18 32 C18 29.5 20.5 28 24 28 C27.5 28 30 29.5 30 32 L30 44" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 16 C24 16 19 13 19 18 C19 21 21.5 23 24 25 C26.5 23 29 21 29 18 C29 13 24 16 24 16Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.7"/>
    </svg>
  );
  return null;
}

// ===== LANDING PAGE =====
export default function LandingPage() {
  const [cities, setCities] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [photographers, setPhotographers] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loadingPhotographers, setLoadingPhotographers] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const featuredRef = useRef(null);

  useEffect(() => {
    document.title = 'SnapBook — Find Your Perfect Photographer';
    fetch('/api/photographers/filters/cities')
      .then(r => r.json())
      .then(d => { if (d.success) setCities(d.cities); })
      .catch(() => {});
    fetch('/api/photographers/filters/event-types')
      .then(r => r.json())
      .then(d => { if (d.success) setEventTypes(d.eventTypes); })
      .catch(() => {});
    loadPhotographers('All');
  }, []);

  const loadPhotographers = (filter) => {
    setLoadingPhotographers(true);
    const params = new URLSearchParams({ limit: 6 });
    if (filter && filter !== 'All') params.set('eventType', filter);
    fetch(`/api/photographers?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setPhotographers(d.photographers);
        setLoadingPhotographers(false);
      })
      .catch(() => setLoadingPhotographers(false));
  };

  const handleSearch = () => {
    setLoadingPhotographers(true);
    setHasSearched(true);
    const params = new URLSearchParams({ limit: 12 });
    if (selectedCity) params.set('city', selectedCity);
    if (selectedEventType) params.set('eventType', selectedEventType);
    fetch(`/api/photographers?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setPhotographers(d.photographers);
        setLoadingPhotographers(false);
        setTimeout(() => featuredRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      })
      .catch(() => setLoadingPhotographers(false));
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setHasSearched(false);
    loadPhotographers(filter);
  };

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < Math.round(rating || 0) ? '#D84315' : '#c9b499' }}>★</span>
  ));

  const ROTATIONS = ['-2.2deg', '1.6deg', '-1deg', '2.4deg', '-0.6deg', '1.2deg'];
  const FILTER_PILLS = ['All', 'Wedding', 'Portrait', 'Corporate', 'Fashion', 'Events'];
  const CATEGORIES = [
    { name: 'Weddings',  color: '#C2185B', bg: '#FCE4EC' },
    { name: 'Portraits', color: '#6A1B9A', bg: '#F3E5F5' },
    { name: 'Corporate', color: '#1565C0', bg: '#E3F2FD' },
    { name: 'Fashion',   color: '#AD1457', bg: '#FCE4EC' },
    { name: 'Events',    color: '#E64A19', bg: '#FBE9E7' },
    { name: 'Family',    color: '#2E7D32', bg: '#E8F5E9' },
  ];
  const TESTIMONIALS = [
    { quote: 'SnapBook connected me with an absolutely incredible photographer. My wedding photos are better than I ever imagined!', name: 'Aisha Rahman', city: 'Lahore', rating: 5, rot: '-2.2deg' },
    { quote: 'Found a great portrait photographer in minutes. The booking process was so smooth and stress-free.', name: 'Carlos Mendez', city: 'Karachi', rating: 5, rot: '1.8deg' },
    { quote: 'As a corporate event manager, I need reliable photographers fast. SnapBook never lets me down.', name: 'Priya Sharma', city: 'Islamabad', rating: 5, rot: '-1.5deg' },
  ];

  return (
    <>
      <Navbar current="home" />

      {/* ━━━━━━━━━━━ HERO ━━━━━━━━━━━ */}
      <section className="sk-hero">
        <div className="sk-hero-gallery" aria-hidden="true">
          <img className="sk-hg-img sk-hg-img--1" src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=320&q=75" alt="" onError={e => { e.target.style.display='none'; }}/>
          <img className="sk-hg-img sk-hg-img--2" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=320&q=75" alt="" onError={e => { e.target.style.display='none'; }}/>
          <img className="sk-hg-img sk-hg-img--3" src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=320&q=75" alt="" onError={e => { e.target.style.display='none'; }}/>
          <img className="sk-hg-img sk-hg-img--4" src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=320&q=75" alt="" onError={e => { e.target.style.display='none'; }}/>
        </div>
        <div className="sk-hero-inner">
          <div className="sk-hero-badge">✦ Trusted by 50,000+ customers</div>
          <h1 className="sk-hero-title">
            Find Your Perfect{' '}
            <span className="sk-hero-accent">
              Photographer
              <svg className="sk-hero-circle" viewBox="0 0 300 72" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18,46 C28,8 78,2 150,6 C222,10 280,20 284,42 C288,64 228,68 150,66 C72,64 8,58 18,46 Z" stroke="#D84315" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </h1>
          <p className="sk-hero-sub">Book verified professionals for weddings, portraits, corporate events &amp; more</p>

          <div className="sk-search-bar">
            <div className="sk-search-field">
              <svg className="sk-search-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="10.5" cy="10.5" r="6" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/>
                <path d="M15.5 15.5 L21 21" stroke="#3E2723" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className="sk-select">
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sk-search-divider" />
            <div className="sk-search-field">
              <svg className="sk-search-icon" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <select value={selectedEventType} onChange={e => setSelectedEventType(e.target.value)} className="sk-select">
                <option value="">All Event Types</option>
                {eventTypes.map(et => <option key={et} value={et}>{et}</option>)}
              </select>
            </div>
            <button onClick={handleSearch} className="sk-search-btn">
              Search
              <svg viewBox="0 0 20 20" fill="none" style={{ width: 16, height: 16, marginLeft: 8, flexShrink: 0 }}>
                <path d="M4 10h12M12 6l4 4-4 4" stroke="#FDFBF7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="sk-stats-bar">
            <span className="sk-stat">500+ Photographers</span>
            <span className="sk-stat-dot">✦</span>
            <span className="sk-stat">50,000+ Photos</span>
            <span className="sk-stat-dot">✦</span>
            <span className="sk-stat">4.9 / 5 Rating</span>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ HOW IT WORKS ━━━━━━━━━━━ */}
      <section className="sk-section sk-how">
        <h2 className="sk-section-title">How SnapBook Works</h2>
        <div className="sk-steps">
          <div className="sk-step">
            <div className="sk-step-icon">
              <svg viewBox="0 0 64 64" fill="none"><circle cx="26" cy="26" r="16" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M37 37 L54 54" stroke="#3E2723" strokeWidth="3" strokeLinecap="round"/><path d="M20 26 C20 22 24 18 28 18" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/><circle cx="26" cy="26" r="6" stroke="#D84315" strokeWidth="1.5" strokeDasharray="3 2"/></svg>
            </div>
            <div className="sk-step-num">01</div>
            <h3>Search</h3>
            <p>Browse verified photographers by city, style &amp; budget</p>
          </div>
          <div className="sk-arrow"><svg viewBox="0 0 80 40" fill="none"><path d="M5,20 C20,8 45,8 60,20 C67,25 71,28 73,30" stroke="#D84315" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3"/><path d="M67 24 L73 30 L65 32" stroke="#D84315" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg></div>
          <div className="sk-step">
            <div className="sk-step-icon">
              <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="12" width="48" height="44" rx="3" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round"/><path d="M8 24 L56 24" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/><path d="M22 8 L22 18 M42 8 L42 18" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round"/><circle cx="22" cy="36" r="3" fill="#D84315"/><circle cx="32" cy="36" r="3" fill="#D84315"/><circle cx="42" cy="36" r="3" stroke="#3E2723" strokeWidth="2"/><path d="M22 46 L36 46" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div className="sk-step-num">02</div>
            <h3>Book</h3>
            <p>Pick your date, confirm details, and pay securely</p>
          </div>
          <div className="sk-arrow"><svg viewBox="0 0 80 40" fill="none"><path d="M5,20 C20,32 45,32 60,20 C67,15 71,12 73,10" stroke="#D84315" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3"/><path d="M67 16 L73 10 L65 8" stroke="#D84315" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg></div>
          <div className="sk-step">
            <div className="sk-step-icon">
              <svg viewBox="0 0 64 64" fill="none"><path d="M6 22 L6 52 C6 54 8 56 10 56 L54 56 C56 56 58 54 58 52 L58 22 C58 20 56 18 54 18 L10 18 C8 18 6 20 6 22 Z" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round"/><circle cx="32" cy="38" r="11" stroke="#3E2723" strokeWidth="2.5"/><circle cx="32" cy="38" r="5" stroke="#D84315" strokeWidth="1.8"/><path d="M24 18 L27 10 L37 10 L40 18" stroke="#3E2723" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="50" cy="24" r="2.5" fill="#D84315"/></svg>
            </div>
            <div className="sk-step-num">03</div>
            <h3>Capture</h3>
            <p>Meet your photographer and create stunning memories</p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━ FEATURED PHOTOGRAPHERS ━━━━━━━━━━━ */}
      <section className="sk-section sk-featured" ref={featuredRef}>
        <div className="sk-section-header">
          <h2 className="sk-section-title">{hasSearched ? 'Search Results' : 'Featured Photographers'}</h2>
          {!hasSearched && <a href="#" className="sk-view-all">View All →</a>}
        </div>
        {hasSearched && (selectedCity || selectedEventType) && (
          <p style={{margin:'-8px 0 16px',fontSize:14,color:'#795548',fontFamily:"'Caveat',cursive"}}>
            {[selectedCity && `City: ${selectedCity}`, selectedEventType && `Event: ${selectedEventType}`].filter(Boolean).join(' · ')}
            {' — '}{photographers.length} photographer{photographers.length !== 1 ? 's' : ''} found
          </p>
        )}
        {!hasSearched && (
          <div className="sk-filter-pills">
            {FILTER_PILLS.map(f => (
              <button key={f} className={'sk-pill' + (activeFilter === f ? ' active' : '')} onClick={() => handleFilterChange(f)}>{f}</button>
            ))}
          </div>
        )}
        {loadingPhotographers ? (
          <div className="sk-loading"><div className="sk-loading-dot"/><div className="sk-loading-dot"/><div className="sk-loading-dot"/></div>
        ) : photographers.length === 0 ? (
          <p className="sk-empty">No photographers found for this category yet.</p>
        ) : (
          <div className="sk-photographer-grid">
            {photographers.slice(0, 6).map((p, i) => (
              <article key={p._id} className="sk-photo-card" style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}>
                <div className="sk-card-cover">
                  {p.profileImage
                    ? <img src={p.profileImage} alt={p.name} onError={e => { e.target.style.display='none'; }}/>
                    : <div className="sk-card-cover-placeholder"><svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="30" r="14" stroke="#3E2723" strokeWidth="2" strokeDasharray="4 2"/><path d="M14 70 C16 52 26 44 40 44 C54 44 64 52 66 70" stroke="#3E2723" strokeWidth="2" strokeLinecap="round"/></svg></div>
                  }
                </div>
                <div className="sk-card-body">
                  <div className="sk-card-name">{p.name}</div>
                  <div className="sk-card-meta">
                    {p.city && <span className="sk-city-badge">{p.city}</span>}
                    {p.specialization && <span className="sk-spec-tag">{p.specialization}</span>}
                  </div>
                  <div className="sk-card-rating">
                    <span className="sk-stars">{renderStars(p.rating)}</span>
                    <span className="sk-review-count">({p.totalReviews || 0})</span>
                  </div>
                  <div className="sk-card-footer">
                    <span className="sk-price">PKR {(p.pricePerHour || 0).toLocaleString()}/hr</span>
                    <a href={'/photographer/' + (p.slug || p._id)} className="sk-book-btn">Book</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━━ CATEGORIES ━━━━━━━━━━━ */}
      <section className="sk-section sk-categories">
        <h2 className="sk-section-title">Browse by Category</h2>
        <div className="sk-category-scroll">
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="sk-category-card" style={{ '--cat-bg': cat.bg }}>
              <span className="sk-category-icon"><CategoryIcon name={cat.name} color={cat.color} /></span>
              <span className="sk-category-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━ TESTIMONIALS ━━━━━━━━━━━ */}
      <section className="sk-section sk-testimonials">
        <h2 className="sk-section-title">What Clients Say</h2>
        <div className="sk-testimonial-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="sk-testimonial-card" style={{ transform: `rotate(${t.rot})` }}>
              <div className="sk-testimonial-stars">
                {Array.from({ length: t.rating }, (_, j) => <span key={j} style={{ color: '#D84315', fontSize: '18px' }}>★</span>)}
              </div>
              <p className="sk-testimonial-text">"{t.quote}"</p>
              <div className="sk-testimonial-author"><strong>{t.name}</strong><span>{t.city}</span></div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <Chatbot />
    </>
  );
}
