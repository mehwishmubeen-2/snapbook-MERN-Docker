import { useState, useEffect, useRef, useCallback } from 'react';
import './customer-dashboard.css';
import Chatbot from '../components/Chatbot.jsx';

/* ── Helpers ── */
    const getToken = () => localStorage.getItem('token');
    const getUser  = () => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } };
    const fmtPKR   = n => 'PKR ' + (Number(n) || 0).toLocaleString('en-PK');
    const fmtDate  = dt => { if (!dt) return '—'; return new Date(dt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' }); };
    const truncId  = id => id ? '#' + String(id).slice(-8).toUpperCase() : '#—';
    const initials = name => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const authHdr  = () => ({ 'Content-Type':'application/json', Authorization:`Bearer ${getToken()}` });

    async function api(url, opts = {}) {
      try {
        const res = await fetch(url, { ...opts, headers: { ...authHdr(), ...(opts.headers || {}) } });
        if (res.status === 401) { window.location.href = '/login'; return null; }
        return res.json();
      } catch { return null; }
    }
    async function pubApi(url) {
      try { const r = await fetch(url); return r.json(); } catch { return null; }
    }

    /* ── Toast helper ── */
    function useToast() {
      const [msg, setMsg] = useState(null);
      const show = useCallback(m => { setMsg(m); setTimeout(() => setMsg(null), 3000); }, []);
      return [msg, show];
    }

    /* ── Debounce hook ── */
    function useDebounced(value, delay = 300) {
      const [debounced, setDebounced] = useState(value);
      useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]);
      return debounced;
    }

    /* ── Primitives ── */
    function Loading() {
      return <div className="cd-loading"><div className="cd-loading-dot"/><div className="cd-loading-dot"/><div className="cd-loading-dot"/></div>;
    }
    function Empty({ icon=null, text, sub }) {
      return (
        <div className="cd-empty">
          <div className="cd-empty-icon">{icon}</div>
          <div className="cd-empty-text">{text}</div>
          {sub && <div className="cd-empty-sub">{sub}</div>}
        </div>
      );
    }
    function Toast({ msg }) { return msg ? <div className="cd-toast">{msg}</div> : null; }
    function Stars({ n = 0, size = 14 }) {
      return <span style={{fontSize:size, letterSpacing:1}}>{[1,2,3,4,5].map(i=><span key={i} style={{color:i<=Math.round(n)?'#D84315':'#c9b499'}}>★</span>)}</span>;
    }
    function StatusBadge({ status }) {
      const s = (status||'').toLowerCase().replace(' ','-');
      return <span className={`cd-status-badge ${s}`}>{status || 'Unknown'}</span>;
    }

    /* ═══════════════════════════════════════════════
       BROWSE TAB
    ═══════════════════════════════════════════════ */
    function BrowseTab({ onGoCart, showToast }) {
      const [search,   setSearch]   = useState('');
      const [city,     setCity]     = useState('');
      const [eventType,setEventType]= useState('');
      const [maxPrice, setMaxPrice] = useState(20000);
      const [minRating,setMinRating]= useState(0);
      const [sort,     setSort]     = useState('');
      const [page,     setPage]     = useState(1);
      const [data,     setData]     = useState(null);
      const [loading,  setLoading]  = useState(false);
      const [cities,   setCities]   = useState([]);
      const [evTypes,  setEvTypes]  = useState([]);

      const debouncedSearch = useDebounced(search, 300);

      useEffect(() => {
        pubApi('/api/photographers/filters/cities').then(d => setCities(d?.cities || []));
        pubApi('/api/photographers/filters/event-types').then(d => setEvTypes(d?.eventTypes || []));
      }, []);

      useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page, limit: 12 });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (city)     params.set('city', city);
        if (eventType) params.set('eventType', eventType);
        if (sort)     params.set('sort', sort);

        pubApi(`/api/photographers?${params}`).then(d => {
          setData(d);
          setLoading(false);
        });
      }, [debouncedSearch, city, eventType, sort, page]);

      const ROTS = ['-0.8deg','0.6deg','-0.5deg','1deg','-0.7deg','0.4deg','-1deg','0.8deg','-0.4deg','0.9deg','-0.6deg','0.5deg'];

      const filteredPhotographers = (data?.photographers || []).filter(p => {
        if ((p.pricePerHour || 0) > maxPrice) return false;
        if ((p.rating || 0) < minRating) return false;
        return true;
      });

      const handleWishlist = async (p) => {
        const d = await api('/api/wishlist/add', { method:'POST', body: JSON.stringify({ photographerId: p.userId }) });
        if (d?.success) showToast('Added to wishlist!');
        else showToast(d?.message || '✗ Failed');
      };

      const totalPages = data?.pagination?.pages || 1;

      return (
        <div>
          {/* Filter bar */}
          <div className="cd-filter-bar">
            <div className="cd-search-wrap cd-filter-group grow">
              <label className="cd-label">Search</label>
              <div style={{position:'relative'}}>
                <span className="cd-search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" className="cd-search-input" placeholder="Specialization, bio…"
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>

            <div className="cd-filter-group">
              <label className="cd-label">City</label>
              <select className="cd-filter-select" value={city} onChange={e => { setCity(e.target.value); setPage(1); }}>
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="cd-filter-group">
              <label className="cd-label">Event Type</label>
              <select className="cd-filter-select" value={eventType} onChange={e => { setEventType(e.target.value); setPage(1); }}>
                <option value="">All Events</option>
                {evTypes.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="cd-filter-group">
              <label className="cd-label">Max Price <span className="cd-range-lbl">{fmtPKR(maxPrice)}</span></label>
              <input type="range" className="cd-price-range" min={1000} max={50000} step={500} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))} />
            </div>

            <div className="cd-filter-group">
              <label className="cd-label">Min Rating</label>
              <select className="cd-filter-select" value={minRating} onChange={e => setMinRating(Number(e.target.value))}>
                <option value={0}>Any</option>
                {[3,4,4.5].map(r => <option key={r} value={r}>★ {r}+</option>)}
              </select>
            </div>

            <div className="cd-filter-group">
              <label className="cd-label">Sort By</label>
              <select className="cd-filter-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
                <option value="">Top Rated</option>
                <option value="price-low">Price: Low</option>
                <option value="price-high">Price: High</option>
                <option value="experience">Experience</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {loading ? <Loading /> : filteredPhotographers.length === 0
            ? <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" style={{width:52,height:52}}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>} text="No photographers found" sub="Try adjusting your filters" />
            : (
              <>
                <div className="cd-pg-grid">
                  {filteredPhotographers.map((p, i) => (
                    <div key={p._id} className="cd-pg-card">
                      <div className="cd-pg-banner-wrap">
                        <img
                          src={getBanner(p, i)}
                          alt={p.specialization || 'Photography'}
                          onError={e => { e.target.style.display='none'; }}
                        />
                        <button className="cd-pg-wl-btn" onClick={e => { e.stopPropagation(); handleWishlist(p); }} title="Save to Wishlist">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                        </button>
                      </div>
                      <div className="cd-pg-body">
                        <div className="cd-pg-av-wrap">
                          <div className="cd-pg-av">
                            {p.profileImage
                              ? <img src={p.profileImage} alt={p.name} />
                              : initials(p.name)
                            }
                          </div>
                          <div>
                            <div className="cd-pg-name">{p.name}</div>
                            {p.city && <div className="cd-pg-city"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:11,height:11,flexShrink:0,marginRight:3}}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{p.city}</div>}
                          </div>
                        </div>
                        <div className="cd-pg-meta">
                          {p.specialization && <span className="cd-pg-spec">{p.specialization}</span>}
                          <span className="cd-pg-rating">★ {Number(p.rating||0).toFixed(1)}</span>
                          <span className="cd-pg-reviews">({p.totalReviews||0})</span>
                        </div>
                        <div className="cd-pg-price">{fmtPKR(p.pricePerHour)}<small>/hr</small></div>
                        <div className="cd-pg-footer">
                          <a href={`/photographer/${p.slug||p._id}`} className="cd-btn cd-btn-primary" style={{textDecoration:'none',flex:1}}>View Profile</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="cd-pg-pagination">
                    <button className="cd-pg-pager" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
                    {Array.from({length:totalPages},(_, i) => (
                      <button key={i+1} className={`cd-pg-pager${page===i+1?' active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                    ))}
                    <button className="cd-pg-pager" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
                  </div>
                )}
              </>
            )
          }
        </div>
      );
    }

    /* ════════════════════════════════════════════
       TRACKING MODAL
    ════════════════════════════════════════════ */
    function TrackingModal({ order, onClose }) {
      const [tracking, setTracking] = useState(null);
      const [loading, setLoading]   = useState(true);

      useEffect(() => {
        api(`/api/orders/${order._id}/tracking`).then(d => {
          setTracking(d?.tracking || null);
          setLoading(false);
        });
      }, [order._id]);

      const STEPS = [
        { key:'placed',    label:'Order Placed',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,verticalAlign:'middle'}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, sub: fmtDate(order.createdAt) },
        { key:'confirmed', label:'Photographer Confirmed', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,verticalAlign:'middle'}}><polyline points="20 6 9 17 4 12"/></svg>, sub: tracking ? fmtDate(tracking.timeline?.confirmed) : '—' },
        { key:'payment',   label:'Payment Received',icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,verticalAlign:'middle'}}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, sub: order.paymentStatus === 'paid' ? 'Paid' : 'Pending' },
        { key:'scheduled', label:'Session Scheduled',icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,verticalAlign:'middle'}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, sub: fmtDate(order.eventDate) },
        { key:'completed', label:'Session Completed',icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,verticalAlign:'middle'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, sub: tracking ? fmtDate(tracking.timeline?.completed) : '—' },
      ];

      const STATUS_IDX = { pending:0, confirmed:1, payment:2, scheduled:3, completed:4, cancelled:-1 };
      const currentIdx = STATUS_IDX[order.status] ?? 0;

      return (
        <div className="cd-modal-overlay" onClick={onClose}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-header">
              <h3 className="cd-modal-title">Track Order {truncId(order._id)}</h3>
              <button className="cd-modal-close" onClick={onClose}>✕</button>
            </div>
            {loading ? <Loading /> : (
              <>
                <div className="cd-timeline">
                  {STEPS.map((step, i) => {
                    const isDone   = i < currentIdx || order.status === 'completed';
                    const isActive = i === currentIdx && order.status !== 'cancelled';
                    return (
                      <div key={step.key} className="cd-tl-step">
                        <div className={`cd-tl-dot ${isDone?'done':isActive?'active':'todo'}`}>
                          {isDone && <span style={{color:'#FDFBF7',fontSize:10,fontWeight:800}}>✓</span>}
                        </div>
                        <div>
                          <div className="cd-tl-label">{step.icon} {step.label}</div>
                          {step.sub !== '—' && <div className="cd-tl-sub">{step.sub}</div>}
                        </div>
                      </div>
                    );
                  })}
                  {order.status === 'cancelled' && (
                    <div className="cd-tl-step">
                      <div className="cd-tl-dot" style={{background:'#b84040',borderColor:'#8a2020'}}>
                        <span style={{color:'#FDFBF7',fontSize:10,fontWeight:800}}>✕</span>
                      </div>
                      <div>
                        <div className="cd-tl-label"><svg viewBox="0 0 24 24" fill="none" stroke="#b84040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,verticalAlign:'middle',marginRight:4}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Cancelled</div>
                        {order.cancellationReason && <div className="cd-tl-sub">{order.cancellationReason}</div>}
                      </div>
                    </div>
                  )}
                </div>
                {tracking && (
                  <div style={{marginTop:18,padding:'12px 14px',background:'rgba(62,39,35,0.04)',border:'1.5px solid rgba(62,39,35,0.1)',borderRadius:10}}>
                    <div style={{fontFamily:'Caveat,cursive',fontSize:16,color:'#3E2723',fontWeight:700,marginBottom:7}}><svg viewBox="0 0 24 24" fill="none" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,verticalAlign:'middle',marginRight:5}}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 7a19.79 19.79 0 01-3.07-8.67A2 2 0 011.72 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L5.93 9.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>Photographer Contact</div>
                    <div style={{fontSize:13,color:'#5D4037'}}>{tracking.photographer?.name}</div>
                    {tracking.photographer?.phone && <div style={{fontSize:13,color:'#5D4037'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,verticalAlign:'middle',marginRight:4}}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>{tracking.photographer.phone}</div>}
                    {tracking.photographer?.email && <div style={{fontSize:13,color:'#5D4037'}}>✉️ {tracking.photographer.email}</div>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    /* ════════════════════════════════════════════
       REVIEW MODAL
    ════════════════════════════════════════════ */
    function ReviewModal({ order, onClose, showToast, onReviewed }) {
      const [rating,  setRating]  = useState(5);
      const [comment, setComment] = useState('');
      const [hover,   setHover]   = useState(0);
      const [loading, setLoading] = useState(false);

      const submit = async () => {
        if (!comment.trim()) { showToast('⚠ Please write a comment'); return; }
        setLoading(true);
        const d = await api('/api/reviews', {
          method: 'POST',
          body: JSON.stringify({
            bookingId: order._id,
            photographerId: order.photographerId?._id || order.photographerId,
            rating,
            comment: comment.trim()
          })
        });
        setLoading(false);
        if (d?.success) {
          showToast('✓ Review submitted! Thank you.');
          onReviewed(order._id);
          onClose();
        } else {
          showToast(d?.message || '✗ Failed to submit');
        }
      };

      const phName = order.photographerId?.name || 'this photographer';

      return (
        <div className="cd-modal-overlay" onClick={onClose}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <div className="cd-modal-header">
              <h3 className="cd-modal-title">Rate &amp; Review</h3>
              <button className="cd-modal-close" onClick={onClose}>✕</button>
            </div>
            <div style={{marginBottom:18,padding:'12px 14px',background:'rgba(243,232,216,0.6)',borderRadius:10,border:'1.5px solid rgba(62,39,35,0.12)'}}>
              <div style={{fontSize:12,color:'#795548',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:700,marginBottom:3}}>Reviewing session with</div>
              <div style={{fontSize:15,fontWeight:700,color:'#3E2723'}}>{phName}</div>
              <div style={{fontSize:12,color:'#8a6552',marginTop:2}}>{order.eventType} · {fmtDate(order.eventDate)}</div>
            </div>
            <div className="cd-label" style={{marginBottom:8}}>Your Rating *</div>
            <div className="cd-star-picker" style={{marginBottom:6}}>
              {[1,2,3,4,5].map(i => (
                <span key={i} className={`cd-star-pick${(hover||rating)>=i?' active':''}`}
                  style={{color:(hover||rating)>=i?'#D84315':'#c9b499'}}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}>★</span>
              ))}
            </div>
            <div style={{fontSize:12,color:'#8a6552',marginBottom:16}}>
              {['','Poor','Fair','Good','Very Good','Excellent'][rating]} — {rating}/5
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Your Review *</label>
              <textarea className="cd-input" rows={4} placeholder="Share your experience with this photographer…"
                style={{borderRadius:8,resize:'vertical'}}
                value={comment} onChange={e => setComment(e.target.value)} />
              <div style={{fontSize:11,color:'#a08070',marginTop:4}}>{comment.trim().length} characters</div>
            </div>
            <button className="cd-btn cd-btn-primary" style={{width:'100%'}} onClick={submit} disabled={loading || !comment.trim()}>
              {loading ? 'Submitting…' : '★ Submit Review'}
            </button>
          </div>
        </div>
      );
    }

    /* ════════════════════════════════════════════
       ORDERS TAB
    ════════════════════════════════════════════ */
    function OrdersTab({ showToast }) {
      const [orders,       setOrders]       = useState(null);
      const [loading,      setLoading]      = useState(true);
      const [tracking,     setTracking]     = useState(null);
      const [reviewing,    setReviewing]    = useState(null);
      const [filter,       setFilter]       = useState('');
      const [reviewedIds,  setReviewedIds]  = useState(new Set());

      // Load orders
      const load = useCallback(() => {
        setLoading(true);
        const params = filter ? `?status=${filter}` : '';
        api(`/api/orders${params}`).then(d => {
          setOrders(d?.orders || []);
          setLoading(false);
        });
      }, [filter]);

      // Load which orders this customer has already reviewed
      useEffect(() => {
        api('/api/reviews/my-reviews').then(d => {
          if (d?.success) {
            setReviewedIds(new Set((d.reviews || []).map(r => String(r.bookingId))));
          }
        });
      }, []);

      useEffect(() => { load(); }, [load]);

      const handleCancel = async (orderId) => {
        if (!window.confirm('Cancel this order?')) return;
        const d = await api(`/api/orders/${orderId}/cancel`, { method:'PATCH', body:JSON.stringify({reason:'Customer request'}) });
        if (d?.success) { showToast('Order cancelled'); load(); }
        else showToast(d?.message || '✗ Failed');
      };

      const markSessionDone = async (orderId) => {
        if (!window.confirm('Confirm your photography session is done? This will mark the order as completed and let you leave a review.')) return;
        const d = await api(`/api/orders/${orderId}/complete`, { method:'PATCH' });
        if (d?.success) {
          showToast('✓ Session marked as done! You can now leave a review.');
          load();
        } else {
          showToast(d?.message || '✗ Failed to update');
        }
      };

      const STATUSES = ['','pending','confirmed','scheduled','completed','cancelled'];

      return (
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:22}}>
            <h2 className="cd-section-title">My Orders</h2>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  className="cd-btn"
                  style={{padding:'6px 13px',fontSize:12,
                    background: filter===s ? '#D84315' : '#FDFBF7',
                    color: filter===s ? '#FDFBF7' : '#3E2723',
                    boxShadow:'2px 2px 0 #3E2723'}}>
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>

          {loading ? <Loading /> : !orders || orders.length === 0
            ? <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" style={{width:52,height:52}}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>} text="No orders yet" sub="Browse photographers and book a session!" />
            : (
              <div className="cd-orders-grid">
                {orders.map(order => {
                  const ph      = order.photographerId || {};
                  const phName  = ph.name || 'Photographer';
                  const phAvDig = initials(phName);
                  return (
                    <div key={order._id} className="cd-order-card">
                      <div className="cd-order-header">
                        <div>
                          <div className="cd-order-id">{truncId(order._id)}</div>
                          <div className="cd-order-date">{fmtDate(order.createdAt)}</div>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="cd-order-ph-row">
                        <div className="cd-order-ph-av">
                          {ph.profileImage ? <img src={ph.profileImage} alt="" /> : phAvDig}
                        </div>
                        <div>
                          <div className="cd-order-ph-name">{phName}</div>
                          {order.location && <div className="cd-order-ph-city"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:11,height:11,marginRight:3}}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{order.location}</div>}
                        </div>
                      </div>

                      <div className="cd-order-details">
                        <div className="cd-order-detail-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{order.eventType}</div>
                        <div className="cd-order-detail-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{fmtDate(order.eventDate)}</div>
                        <div className="cd-order-detail-row"><span>⏱</span>{order.duration}h session</div>
                        {order.notes && <div className="cd-order-detail-row" style={{fontStyle:'italic'}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,flexShrink:0}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>{order.notes}</div>}
                      </div>

                      <div className="cd-order-price">
                        {fmtPKR(order.totalAmount)} <small>total</small>
                      </div>

                      <div className="cd-order-actions">
                        <button className="cd-btn cd-btn-secondary" onClick={() => setTracking(order)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>Track Order
                        </button>
                        {order.status === 'completed' && (
                          reviewedIds.has(String(order._id))
                            ? <span className="cd-btn" style={{background:'rgba(74,124,89,0.1)',color:'#2a5c3c',borderColor:'#4a7c59',cursor:'default',gap:5}}>
                                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width:13,height:13}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Reviewed ✓
                              </span>
                            : <button className="cd-btn cd-btn-primary" onClick={() => setReviewing(order)} style={{gap:5}}>
                                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{width:13,height:13,verticalAlign:'middle'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>Leave Review
                              </button>
                        )}
                        {['confirmed','scheduled','in-progress','pending'].includes(order.status) && new Date(order.eventDate) <= new Date() && (
                          <button className="cd-btn cd-btn-secondary" onClick={() => markSessionDone(order._id)} style={{gap:5}}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,verticalAlign:'middle'}}><polyline points="20 6 9 17 4 12"/></svg>Session Done
                          </button>
                        )}
                        {order.status === 'pending' && new Date(order.eventDate) > new Date() && (
                          <button className="cd-btn cd-btn-danger" onClick={() => handleCancel(order._id)}>
                            ✕ Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }

          {tracking  && <TrackingModal order={tracking}  onClose={() => setTracking(null)}  />}
          {reviewing && <ReviewModal
            order={reviewing}
            onClose={() => setReviewing(null)}
            showToast={showToast}
            onReviewed={id => setReviewedIds(prev => new Set([...prev, String(id)]))}
          />}
        </div>
      );
    }

    /* ════════════════════════════════════════════
       CART TAB
    ════════════════════════════════════════════ */
    function CartTab({ showToast, onCartChanged }) {
      const [cart,       setCart]       = useState(null);
      const [loading,    setLoading]    = useState(true);
      const [couponCode, setCouponCode] = useState('');
      const [couponData, setCouponData] = useState(null);
      const [couponMsg,  setCouponMsg]  = useState(null);
      const [couponOk,   setCouponOk]   = useState(false);
      const [paymentMethod, setPaymentMethod] = useState('card');
      const [cardNum,    setCardNum]    = useState('');
      const [expiry,     setExpiry]     = useState('');
      const [cvv,        setCvv]        = useState('');
      const [paying,     setPaying]     = useState(false);

      const loadCart = useCallback(() => {
        setLoading(true);
        api('/api/cart').then(d => { setCart(d?.cart || null); setLoading(false); });
      }, []);

      useEffect(() => { loadCart(); }, [loadCart]);

      const removeItem = async (itemId) => {
        const d = await api(`/api/cart/remove/${itemId}`, { method:'DELETE' });
        if (d?.success) { setCart(d.cart); onCartChanged(d.cart.items.length); }
        else showToast('✗ Failed to remove');
      };

      const updateDur = async (itemId, curDur, delta) => {
        const newDur = Math.max(1, curDur + delta);
        const d = await api(`/api/cart/update/${itemId}`, { method:'PUT', body:JSON.stringify({ duration:newDur }) });
        if (d?.success) { setCart(d.cart); onCartChanged(d.cart.items.length); }
        else showToast('✗ Failed to update');
      };

      const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        const subtotal = cart?.totalCost || 0;
        const d = await api('/api/coupon/validate', { method:'POST', body:JSON.stringify({ code:couponCode, orderTotal:subtotal }) });
        if (d?.success) {
          setCouponOk(true);
          setCouponData(d.coupon);
          setCouponMsg(d.coupon?.message || 'Coupon applied!');
        } else {
          setCouponOk(false);
          setCouponData(null);
          setCouponMsg(d?.message || 'Invalid coupon');
        }
      };

      const handleCheckout = async () => {
        if (!cart || !cart.items.length) return;
        
        if (paymentMethod === 'card' && (!cardNum || !expiry || !cvv)) {
            showToast('Please fill in all card details.');
            return;
        }

        setPaying(true);
        const body = {
            paymentMethod,
            couponCode: couponOk ? couponCode : null,
        };

        if (paymentMethod === 'card') {
            body.cardInfo = { cardNum, expiry, cvv };
        }

        const d = await api('/api/orders/create-from-cart', { 
            method:'POST',
            body: JSON.stringify(body)
        });

        setPaying(false);
        if (d?.success) {
          showToast('Order placed successfully!');
          loadCart();
          onCartChanged(0);
        } else {
          showToast(d?.message || '✗ Failed to place order');
        }
      };

      const fmtCard = v => v.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19);


      if (loading) return <Loading />;
      const items = cart?.items || [];
      const subtotal = cart?.totalCost || 0;
      const discount = couponData?.discount || 0;
      const total    = couponData?.newTotal ?? subtotal;

      if (items.length === 0) {
        return <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" style={{width:52,height:52}}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>} text="Your cart is empty" sub="Browse photographers and add them to your cart!" />;
      }

      return (
        <div>
          <h2 className="cd-section-title">My Cart</h2>
          <div className="cd-cart-layout">
            {/* Item list */}
            <div>
              <div className="cd-cart-items">
                {items.map(item => {
                  const ph = item.photographerId || {};
                  const phName = ph.name || 'Photographer';
                  return (
                    <div key={item._id} className="cd-cart-item">
                      <div className="cd-ci-av">
                        {ph.profileImage ? <img src={ph.profileImage} alt="" /> : <svg viewBox="0 0 24 24" fill="none" stroke="#3E2723" strokeWidth="1.5" style={{width:28,height:28}}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>}
                      </div>
                      <div className="cd-ci-body">
                        <div className="cd-ci-name">{phName}</div>
                        <div className="cd-ci-details">
                          <div className="cd-ci-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{item.eventType}</div>
                          <div className="cd-ci-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,flexShrink:0}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{fmtDate(item.eventDate)}</div>
                          <div className="cd-ci-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,flexShrink:0}}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>{item.location}</div>
                          <div className="cd-ci-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,flexShrink:0}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>{fmtPKR(item.pricePerHour)}/hr</div>
                        </div>
                        <div className="cd-ci-dur-row">
                          <button className="cd-ci-dur-btn" onClick={() => updateDur(item._id, item.duration, -1)}>−</button>
                          <span className="cd-ci-dur-val">{item.duration}h</span>
                          <button className="cd-ci-dur-btn" onClick={() => updateDur(item._id, item.duration, +1)}>+</button>
                          <span style={{fontSize:12,color:'#8a6552',marginLeft:6}}>duration</span>
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                        <span className="cd-ci-price">{fmtPKR(item.totalPrice)}</span>
                        <span className="cd-ci-remove" onClick={() => removeItem(item._id)} title="Remove">✕</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div style={{marginTop:18}}>
                <label className="cd-label">Have a Coupon?</label>
                <div className="cd-coupon-row">
                  <input type="text" className="cd-input" placeholder="ENTER CODE"
                    value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    style={{textTransform:'uppercase', letterSpacing:2}} />
                  <button className="cd-btn cd-btn-secondary" onClick={applyCoupon}>Apply</button>
                </div>
                {couponMsg && (
                  <div className={`cd-coupon-msg ${couponOk?'ok':'err'}`}>
                    {couponOk ? '✓ ' : '✗ '}{couponMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="cd-order-summary">
              <div className="cd-summary-title">Order Summary</div>
              <div className="cd-summary-row">
                <span>Subtotal ({items.length} item{items.length!==1?'s':''})</span>
                <span className="cd-summary-val">{fmtPKR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="cd-summary-row">
                  <span>Coupon Discount</span>
                  <span className="cd-summary-val discount">− {fmtPKR(discount)}</span>
                </div>
              )}
              <div className="cd-summary-row total">
                <span>Total</span>
                <span className="cd-summary-val">{fmtPKR(total)}</span>
              </div>

              <div className="cd-pay-form" style={{marginTop:20}}>
                <div className="cd-pay-title" style={{marginBottom:12}}>Payment Method</div>
                <div className="cd-payment-options">
                  <div className={`cd-payment-option ${paymentMethod==='card'?'selected':''}`}
                    onClick={() => setPaymentMethod('card')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    <span>Pay with Card</span>
                  </div>
                  <div className={`cd-payment-option ${paymentMethod==='cod'?'selected':''}`}
                    onClick={() => setPaymentMethod('cod')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
                    <span>Cash on Delivery</span>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div style={{marginTop:14}}>
                    <div className="cd-card-preview">
                      <span className="cd-card-preview-num">{(cardNum||'•••• •••• •••• ••••').padEnd(19,'•')}</span>
                      <span className="cd-card-preview-logo"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>
                    </div>
                    <div className="cd-form-group">
                      <label className="cd-label">Card Number</label>
                      <input type="text" className="cd-input" placeholder="1234 5678 9012 3456"
                        maxLength={19} value={cardNum}
                        onChange={e => setCardNum(fmtCard(e.target.value))} />
                    </div>
                    <div className="cd-pay-grid">
                      <div className="cd-form-group">
                        <label className="cd-label">Expiry</label>
                        <input type="text" className="cd-input" placeholder="MM/YY" maxLength={5}
                          value={expiry}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g,'');
                            if (v.length>=2) v = v.slice(0,2)+'/'+v.slice(2,4);
                            setExpiry(v);
                          }} />
                      </div>
                      <div className="cd-form-group">
                        <label className="cd-label">CVV</label>
                        <input type="password" className="cd-input" placeholder="•••" maxLength={4}
                          value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,''))} />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div style={{marginTop:14,padding:'10px 12px',background:'rgba(74,124,89,0.08)',border:'1.5px solid rgba(74,124,89,0.3)',borderRadius:8,fontSize:13,color:'#2a5c3c'}}>
                    <strong>Cash on Delivery</strong> — Pay when the photographer arrives for your session.
                  </div>
                )}

                <button className="cd-pay-btn" style={{marginTop:16}} disabled={paying || (paymentMethod==='card' && (!cardNum||!expiry||!cvv))}
                  onClick={handleCheckout}>
                  {paying ? 'Processing...' : (paymentMethod === 'cod' ? 'Place Order (Cash on Delivery)' : `Pay ${fmtPKR(total)}`)}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ════════════════════════════════════════════
       WISHLIST TAB
    ════════════════════════════════════════════ */
    function WishlistTab({ showToast, onCartChanged }) {
      const [wl,      setWl]      = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        api('/api/wishlist').then(d => { setWl(d?.wishlist || null); setLoading(false); });
      }, []);

      const remove = async (photographerId) => {
        const d = await api(`/api/wishlist/remove/${photographerId}`, { method:'DELETE' });
        if (d?.success) { setWl(d.wishlist); showToast('Removed from wishlist'); }
        else showToast('✗ Failed');
      };

      const moveToCart = async (p) => {
        const ph = p.photographerId || {};
        const phId = ph._id || ph;
        const d = await api('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({
            photographerId: phId,
            eventDate: new Date(Date.now() + 7*24*3600*1000).toISOString().split('T')[0],
            eventType: 'General',
            location: 'To be confirmed',
            duration: 4,
            pricePerHour: 0,
            notes: 'Moved from wishlist — please update details'
          })
        });
        if (d?.success) {
          showToast('✓ Added to cart!');
          onCartChanged((d.cart?.items?.length) || 1);
          await api(`/api/wishlist/remove/${phId}`, { method:'DELETE' }).then(wd => {
            if (wd?.success) setWl(wd.wishlist);
          });
        } else {
          showToast(d?.message || '✗ Failed to move to cart');
        }
      };

      if (loading) return <Loading />;
      const photographers = wl?.photographers || [];
      if (photographers.length === 0) {
        return <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" style={{width:52,height:52}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>} text="Your wishlist is empty" sub="Tap the heart icon on any photographer card to save them!" />;
      }

      return (
        <div>
          <h2 className="cd-section-title">My Wishlist</h2>
          <div className="cd-wishlist-grid">
            {photographers.map(item => {
              const ph = item.photographerId || {};
              const phId = ph._id || item.photographerId;
              const phName = ph.name || 'Photographer';
              return (
                <div key={phId} className="cd-wl-card">
                  <button className="cd-wl-remove" onClick={() => remove(phId)} title="Remove">✕</button>
                  <div style={{width:'100%',height:100,background:'linear-gradient(135deg,#4e2a10,#7c4a1e)',overflow:'hidden'}}>
                    {ph.profileImage && <img src={ph.profileImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(0.7)'}} />}
                  </div>
                  <div className="cd-wl-footer">
                    <div className="cd-pg-av-wrap" style={{marginBottom:0}}>
                      <div className="cd-pg-av">
                        {ph.profileImage ? <img src={ph.profileImage} alt="" /> : initials(phName)}
                      </div>
                      <div>
                        <div className="cd-pg-name">{phName}</div>
                        {ph.slug && <div className="cd-pg-city">@{ph.slug}</div>}
                      </div>
                    </div>
                    <a href={`/photographer/${ph.slug||phId}`}
                      className="cd-btn cd-btn-primary" style={{textDecoration:'none',width:'100%',justifyContent:'center'}}>
                      View Profile
                    </a>
                    <button className="cd-btn cd-btn-secondary" style={{width:'100%'}} onClick={() => moveToCart(item)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>Move to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    /* ════════════════════════════════════════════
       PROFILE TAB
    ════════════════════════════════════════════ */
    function ProfileTab({ user: initUser, showToast }) {
      const [name,    setName]    = useState(initUser?.name || '');
      const [phone,   setPhone]   = useState(initUser?.phone || '');
      const [saving,  setSaving]  = useState(false);
      const [pwCur,   setPwCur]   = useState('');
      const [pwNew,   setPwNew]   = useState('');
      const [pwNew2,  setPwNew2]  = useState('');
      const [pwSaving,setPwSaving]= useState(false);

      const saveProfile = async () => {
        setSaving(true);
        const d = await api('/api/auth/profile', { method:'PUT', body:JSON.stringify({ name, phone }) });
        setSaving(false);
        if (d?.success) {
          showToast('✓ Profile updated');
          const stored = getUser();
          if (stored) { stored.name = name; localStorage.setItem('user', JSON.stringify(stored)); }
        } else showToast(d?.message || '✗ Failed');
      };

      const changePassword = async () => {
        if (pwNew !== pwNew2) { showToast('⚠ New passwords do not match'); return; }
        if (pwNew.length < 6) { showToast('⚠ Password must be at least 6 characters'); return; }
        setPwSaving(true);
        const d = await api('/api/auth/change-password', { method:'PUT', body:JSON.stringify({ currentPassword:pwCur, newPassword:pwNew }) });
        setPwSaving(false);
        if (d?.success) { showToast('✓ Password changed'); setPwCur(''); setPwNew(''); setPwNew2(''); }
        else showToast(d?.message || '✗ Failed');
      };

      return (
        <div>
          <h2 className="cd-section-title">My Profile</h2>
          <div className="cd-profile-grid">
            <div>
              <div className="cd-card">
                <div style={{fontFamily:'DM Serif Display, serif',fontSize:17,color:'#3E2723',marginBottom:18}}>Personal Info</div>
                {/* Avatar */}
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                  <div style={{
                    width:64,height:64,borderRadius:'50%',border:'2.5px solid #3E2723',
                    boxShadow:'3px 3px 0 #3E2723',background:'linear-gradient(135deg,#c07c1a,#D84315)',
                    display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0
                  }}>
                    {initUser?.profileImage
                      ? <img src={initUser.profileImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      : <span style={{fontFamily:'Caveat,cursive',fontSize:28,fontWeight:700,color:'#FDFBF7'}}>{initials(name)}</span>
                    }
                  </div>
                  <div>
                    <div style={{fontFamily:'DM Serif Display,serif',fontSize:18,color:'#3E2723'}}>{name}</div>
                    <div style={{fontFamily:'Caveat,cursive',fontSize:14,color:'#D84315',fontWeight:700}}>Customer</div>
                    <div style={{fontSize:12,color:'#8a6552',marginTop:2}}>{initUser?.email}</div>
                  </div>
                </div>

                <div className="cd-form-group">
                  <label className="cd-label">Full Name</label>
                  <input type="text" className="cd-input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="cd-form-group">
                  <label className="cd-label">Email</label>
                  <input type="email" className="cd-input" value={initUser?.email || ''} disabled
                    style={{opacity:0.55,cursor:'not-allowed'}} />
                </div>
                <div className="cd-form-group">
                  <label className="cd-label">Phone</label>
                  <input type="tel" className="cd-input" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+92 300 0000000" />
                </div>
                <button className="cd-btn cd-btn-primary" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving…' : '✓ Save Changes'}
                </button>
              </div>
            </div>
            <div>
              <div className="cd-card">
                <div style={{fontFamily:'DM Serif Display, serif',fontSize:17,color:'#3E2723',marginBottom:18}}>Change Password</div>
                <div className="cd-form-group">
                  <label className="cd-label">Current Password</label>
                  <input type="password" className="cd-input" value={pwCur} onChange={e => setPwCur(e.target.value)} />
                </div>
                <div className="cd-form-group">
                  <label className="cd-label">New Password</label>
                  <input type="password" className="cd-input" value={pwNew} onChange={e => setPwNew(e.target.value)} />
                </div>
                <div className="cd-form-group">
                  <label className="cd-label">Confirm New Password</label>
                  <input type="password" className="cd-input" value={pwNew2} onChange={e => setPwNew2(e.target.value)} />
                </div>
                <button className="cd-btn cd-btn-secondary" onClick={changePassword} disabled={pwSaving || !pwCur || !pwNew}>
                  {pwSaving ? 'Saving…' : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:6}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>Update Password</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ── Landscape banner thumbnails by specialization (module-scope) ── */
    const SPEC_BANNERS = {
      'Wedding Photography':        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=75',
      'Portrait Photography':       'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=75',
      'Portrait & Aesthetic Photography': 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=75',
      'Aesthetic & Maternity Photography': 'https://images.unsplash.com/photo-1555861496-0666c8981751?auto=format&fit=crop&w=600&q=75',
      'Corporate Photography':      'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=600&q=75',
      'Event & Birthday Photography':'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=75',
      'Fashion Photography':        'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=75',
      'Family Photography':         'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&w=600&q=75',
      'Newborn Photography':        'https://images.unsplash.com/photo-1555861496-0666c8981751?auto=format&fit=crop&w=600&q=75',
      'Architecture Photography':   'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=600&q=75',
      'Food Photography':           'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=75',
      'Sports Photography':         'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=75',
    };
    const DEFAULT_BANNERS = [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1542038374547-d4e92eecb1f6?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=600&q=75',
      'https://images.unsplash.com/photo-1473093226555-0b7a536c2b2b?auto=format&fit=crop&w=600&q=75',
    ];
    const getBanner = (p, idx) => SPEC_BANNERS[p.specialization] || DEFAULT_BANNERS[idx % DEFAULT_BANNERS.length];

    /* ════════════════════════════════════════════
       APP ROOT
    ════════════════════════════════════════════ */
    function App() {
      const token = getToken();
      if (!token) { window.location.href = '/login'; return null; }

      const user = getUser();
      const [activeTab,  setActiveTab ] = useState('browse');
      const [cartCount,  setCartCount ] = useState(0);
      const [toast, showToast]          = useToast();

      useEffect(() => {
        api('/api/cart').then(d => {
          if (d?.cart) setCartCount(d.cart.items?.length || 0);
        });
      }, []);

      /* ── SVG Nav Icons ── */
      const IconBrowse = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      );
      const IconOrders = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
        </svg>
      );
      const IconCart = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      );
      const IconWishlist = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      );
      const IconProfile = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      );
      const IconLogout = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      );
      const IconCartSmall = () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{width:17,height:17,flexShrink:0}}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      );

      const TABS = [
        { id:'browse',   label:'Browse',     icon: <IconBrowse /> },
        { id:'orders',   label:'My Orders',  icon: <IconOrders /> },
        { id:'cart',     label:'My Cart',    icon: <IconCart />, badge: cartCount },
        { id:'wishlist', label:'Wishlist',   icon: <IconWishlist /> },
        { id:'profile',  label:'My Profile', icon: <IconProfile /> },
      ];

      const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      };

      const renderTab = () => {
        switch (activeTab) {
          case 'browse':   return <BrowseTab   onGoCart={() => setActiveTab('cart')} showToast={showToast} />;
          case 'orders':   return <OrdersTab   showToast={showToast} />;
          case 'cart':     return <CartTab     showToast={showToast} onCartChanged={n => setCartCount(n)} />;
          case 'wishlist': return <WishlistTab showToast={showToast} onCartChanged={n => setCartCount(c => c + n)} />;
          case 'profile':  return <ProfileTab  user={user} showToast={showToast} />;
          default:         return null;
        }
      };

      const userInitials = initials(user?.name || 'U');

      return (
        <div className="cd-shell">
          {/* Top Navigation */}
          <header className="cd-topnav">
            <a href="/" className="cd-topnav-logo">Snap<span>Book</span></a>
            <nav className="cd-topnav-tabs">
              {TABS.map(t => (
                <button key={t.id} className={`cd-topnav-tab${activeTab===t.id?' active':''}`}
                  onClick={() => setActiveTab(t.id)}>
                  <span className="cd-topnav-tab-icon">{t.icon}</span>
                  {t.label}
                  {t.badge > 0 && <span className="cd-nav-badge">{t.badge}</span>}
                </button>
              ))}
            </nav>
            <div className="cd-topnav-right">
              <div className="cd-topnav-user">
                <div className="cd-topnav-avatar">
                  {user?.profileImage
                    ? <img src={user.profileImage} alt="" />
                    : userInitials
                  }
                </div>
                <span className="cd-topnav-username">{user?.name?.split(' ')[0] || 'Guest'}</span>
              </div>
              <button className="cd-topnav-logout" onClick={handleLogout} title="Logout">
                <IconLogout />
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="cd-page">
            {activeTab === 'browse' && (
              <div className="cd-browse-hero">
                <div className="cd-browse-hero-eyebrow">SnapBook Marketplace</div>
                <div className="cd-browse-hero-title">Find Your Perfect Photographer</div>
                <div className="cd-browse-hero-sub">Discover talented photographers across Pakistan</div>
              </div>
            )}
            <div className="cd-content">
              {renderTab()}
            </div>
          </main>

          <Toast msg={toast} />
          <Chatbot />
        </div>
      );
    }

export default App;
