import { useState, useEffect, useCallback } from 'react';
import './photographer-dashboard.css';
import Chatbot from '../components/Chatbot.jsx';

/* ── Auth helpers ── */
    const getToken = () => localStorage.getItem('token');
    const getUser  = () => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } };
    const authHdr  = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
    const fmt = n  => 'PKR ' + (Number(n) || 0).toLocaleString('en-PK');

    async function api(url, opts = {}) {
      const res = await fetch(url, { ...opts, headers: { ...authHdr(), ...(opts.headers || {}) } });
      if (res.status === 401) { window.location.href = '/login'; return null; }
      return res.json().catch(() => null);
    }

    /* ── Custom hook: Toast ── */
    function useToast() {
      const [toast, setToast] = useState(null);
      const show = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
      }, []);
      return [toast, show];
    }

    /* ── Shared primitives ── */
    function Loading() {
      return (
        <div className="pd-loading">
          <div className="pd-loading-dot" /><div className="pd-loading-dot" /><div className="pd-loading-dot" />
        </div>
      );
    }
    function Empty({ icon = null, text = 'Nothing here yet' }) {
      return (
        <div className="pd-empty">
          <div className="pd-empty-icon">{icon}</div>
          <div className="pd-empty-text">{text}</div>
        </div>
      );
    }
    function StatusBadge({ status }) {
      const map = { pending:'pd-badge-pending', confirmed:'pd-badge-confirmed', completed:'pd-badge-completed', cancelled:'pd-badge-cancelled' };
      return <span className={`pd-badge ${map[status] || 'pd-badge-pending'}`}>{status || 'unknown'}</span>;
    }
    function Toast({ msg }) {
      return msg ? <div className="pd-toast">{msg}</div> : null;
    }
    function fmtDate(dt) {
      if (!dt) return '—';
      return new Date(dt).toLocaleDateString('en-PK', { day:'numeric', month:'short', year:'numeric' });
    }

    /* ==============================================================
       TAB: OVERVIEW
       ============================================================== */
    function OverviewTab() {
      const [stats, setStats]   = useState({ total:0, pending:0, monthly:0, rating:0 });
      const [orders, setOrders] = useState([]);
      const [loading, setLoading] = useState(true);
      const user = getUser();
      const userId = user?._id || user?.id;

      useEffect(() => {
        Promise.all([
          api('/api/orders'),
          api('/api/commission/earnings'),
          api(`/api/photographers/profile/me`),
        ]).then(([ordData, earData, proData]) => {
          const all = ordData?.orders || [];
          const now = new Date();
          const pending = all.filter(o => (o.bookingStatus || o.status) === 'pending').length;
          const monthly = all.filter(o => {
            const d = new Date(o.createdAt);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).reduce((s, o) => s + (o.totalAmount || 0), 0);
          setStats({
            total: all.length,
            pending,
            monthly: earData?.photographerEarning || Math.round(monthly * 0.85),
            rating: proData?.photographer?.rating || proData?.rating || 0,
          });
          setOrders(all.slice(0, 8));
          setLoading(false);
        }).catch(() => setLoading(false));
      }, []);

      const cards = [
        { label:'Total Bookings',   value: stats.total,                           icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color:'blue',  sub:'All time' },
        { label:'Pending Requests', value: stats.pending,                         icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color:'amber', sub:'Awaiting confirmation', pulse: stats.pending > 0 },
        { label:'Monthly Earnings', value: fmt(Math.round(stats.monthly)),        icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>, color:'green', sub:'Your 85% share' },
        { label:'Avg Rating',       value: Number(stats.rating).toFixed(1) + ' ★', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, color:'terra', sub:'From all reviews' },
      ];

      return (
        <div>
          <h1 className="pd-page-title"><span>Overview</span></h1>
          <div className="pd-stats-grid">
            {cards.map(c => (
              <div key={c.label} className={`pd-stat-card ${c.color}${c.pulse ? ' pulsing' : ''}`}>
                <div className="pd-stat-icon">{c.icon}</div>
                <div className="pd-stat-label">{c.label}</div>
                <div className="pd-stat-value">{loading ? '—' : c.value}</div>
                <div className="pd-stat-sub">{c.sub}</div>
              </div>
            ))}
          </div>
          <div className="pd-table-wrap">
            <div className="pd-table-head-row">
              <span className="pd-table-title">Recent Orders</span>
            </div>
            {loading ? <Loading /> : orders.length === 0
              ? <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>} text="No orders yet — share your profile link!" />
              : (
                <table className="pd-table">
                  <thead><tr>
                    <th>Customer</th><th>Event Type</th><th>Date</th>
                    <th>Amount</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id}>
                        <td>{o.customerId?.name || o.customerName || '—'}</td>
                        <td>{o.eventType || '—'}</td>
                        <td>{fmtDate(o.eventDate)}</td>
                        <td style={{fontFamily:'Caveat,cursive',fontSize:16,fontWeight:700}}>{fmt(o.totalAmount)}</td>
                        <td><StatusBadge status={o.bookingStatus || o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      );
    }

    /* ==============================================================
       TAB: PORTFOLIO
       ============================================================== */
    function PortfolioTab() {
      const [items, setItems]       = useState([]);
      const [loading, setLoading]   = useState(true);
      const [showModal, setShowModal] = useState(false);
      const [lightbox, setLightbox] = useState(null);
      const [form, setForm]         = useState({ imageUrl:'', title:'', description:'' });
      const [saving, setSaving]     = useState(false);
      const [toast, showToast]      = useToast();

      const ROTS = ['-2.2deg','1.6deg','-1deg','2.4deg','-0.8deg','1.3deg','-1.9deg','0.7deg'];

      useEffect(() => {
        api('/api/portfolio').then(d => {
          setItems(d?.portfolio || d?.items || d?.data || []);
          setLoading(false);
        }).catch(() => setLoading(false));
      }, []);

      const handleUpload = async (e) => {
        e.preventDefault();
        if (!form.imageUrl) return;
        setSaving(true);
        const d = await api('/api/portfolio', {
          method: 'POST',
          body: JSON.stringify({ imageUrl: form.imageUrl, title: form.title, description: form.description }),
        });
        setSaving(false);
        if (d) {
          const newItem = d.item || d.portfolio || { _id: Date.now().toString(), ...form };
          setItems(prev => [newItem, ...prev]);
          setForm({ imageUrl:'', title:'', description:'' });
          setShowModal(false);
          showToast('✓ Photo added to portfolio!');
        } else {
          showToast('✗ Upload failed — check console');
        }
      };

      const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Remove this photo from portfolio?')) return;
        await api(`/api/portfolio/${id}`, { method:'DELETE' });
        setItems(prev => prev.filter(it => it._id !== id));
        showToast('✓ Photo removed');
      };

      return (
        <div>
          <h1 className="pd-page-title">
            <span>Portfolio</span>
            <button className="pd-btn pd-btn-primary" onClick={() => setShowModal(true)}>＋ Upload Photo</button>
          </h1>
          {loading ? <Loading /> : items.length === 0
            ? <div className="pd-section-card"><Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>} text="Add your first portfolio photo!" /></div>
            : (
              <div className="pd-portfolio-grid">
                {items.map((item, i) => (
                  <div
                    key={item._id}
                    className="pd-polaroid"
                    style={{ transform:`rotate(${ROTS[i % ROTS.length]})` }}
                    onClick={() => setLightbox(item)}
                  >
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.title || ''} className="pd-polaroid-img" onError={e => e.target.style.display='none'} />
                      : <div className="pd-polaroid-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="#c9b499" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:32,height:32}}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
                    }
                    <div className="pd-polaroid-caption">{item.title || 'Untitled'}</div>
                    <button className="pd-polaroid-delete" onClick={(e) => handleDelete(item._id, e)}>✕</button>
                  </div>
                ))}
              </div>
            )}

          {/* Upload Modal */}
          {showModal && (
            <div className="pd-modal-overlay" onClick={() => setShowModal(false)}>
              <div className="pd-modal" onClick={e => e.stopPropagation()}>
                <button className="pd-modal-close" onClick={() => setShowModal(false)}>✕</button>
                <h2 className="pd-modal-title">Upload Portfolio Photo</h2>
                <form onSubmit={handleUpload}>
                  <div className="pd-form-group">
                    <label className="pd-label">Image URL *</label>
                    <input className="pd-input" type="url" placeholder="https://..." required
                      value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl:e.target.value}))} />
                  </div>
                  <div className="pd-form-group">
                    <label className="pd-label">Title</label>
                    <input className="pd-input" type="text" placeholder="e.g. Summer Wedding, Lahore"
                      value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} />
                  </div>
                  <div className="pd-form-group">
                    <label className="pd-label">Description</label>
                    <textarea className="pd-input" placeholder="Brief description…" rows={3}
                      style={{resize:'vertical', borderRadius:8}}
                      value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} />
                  </div>
                  <button type="submit" className="pd-btn pd-btn-primary" style={{width:'100%', justifyContent:'center'}} disabled={saving}>
                    {saving ? 'Uploading…' : '＋ Add to Portfolio'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Lightbox */}
          {lightbox && (
            <div className="pd-lightbox-overlay" onClick={() => setLightbox(null)}>
              <div className="pd-lightbox-inner" onClick={e => e.stopPropagation()}>
                <button className="pd-lightbox-close" onClick={() => setLightbox(null)}>✕</button>
                <img src={lightbox.imageUrl} alt={lightbox.title || ''} className="pd-lightbox-img" />
                {lightbox.title && <div className="pd-lightbox-caption">{lightbox.title}</div>}
              </div>
            </div>
          )}
          <Toast msg={toast} />
        </div>
      );
    }

    /* ==============================================================
       TAB: AVAILABILITY
       ============================================================== */
    function AvailabilityTab() {
      const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const [workingDays, setWorkingDays] = useState([]);
      const [start, setStart] = useState('09:00');
      const [end,   setEnd  ] = useState('18:00');
      const [blocked, setBlocked] = useState([]);
      const [newDate, setNewDate] = useState('');
      const [loading, setLoading] = useState(true);
      const [saving,  setSaving ] = useState(false);
      const [toast, showToast]    = useToast();
      const user   = getUser();
      const userId = user?._id || user?.id;

      useEffect(() => {
        api(`/api/availability/${userId}`).then(d => {
          const av = d?.availability || d?.data || d;
          if (av && typeof av === 'object' && !av.message) {
            setWorkingDays(av.workingDays || []);
            setStart(av.workingHours?.start || '09:00');
            setEnd(av.workingHours?.end   || '18:00');
            setBlocked((av.blockedDates || []).map(dt => new Date(dt).toISOString().split('T')[0]));
          }
          setLoading(false);
        }).catch(() => setLoading(false));
      }, [userId]);

      const toggleDay = (day) =>
        setWorkingDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

      const addDate = () => {
        if (newDate && !blocked.includes(newDate)) {
          setBlocked(prev => [...prev, newDate].sort());
          setNewDate('');
        }
      };

      const handleSave = async () => {
        setSaving(true);
        const d = await api('/api/availability', {
          method: 'PUT',
          body: JSON.stringify({ workingDays, workingHours:{ start, end }, blockedDates: blocked }),
        });
        setSaving(false);
        showToast(d?.availability || d?.success ? '✓ Availability saved!' : '✗ Save failed');
      };

      if (loading) return <><h1 className="pd-page-title"><span>Availability</span></h1><Loading /></>;

      return (
        <div>
          <h1 className="pd-page-title"><span>Availability</span></h1>

          <div className="pd-section-card">
            <div className="pd-section-card-title">Working Days</div>
            <div className="pd-day-pills">
              {DAYS.map(day => (
                <button key={day} type="button"
                  className={`pd-day-pill${workingDays.includes(day) ? ' active' : ''}`}
                  onClick={() => toggleDay(day)}>
                  {day.slice(0,3)}
                </button>
              ))}
            </div>
          </div>

          <div className="pd-section-card">
            <div className="pd-section-card-title">Working Hours</div>
            <div className="pd-time-row">
              <div className="pd-form-group">
                <label className="pd-label">Start Time</label>
                <input type="time" className="pd-input" value={start} onChange={e => setStart(e.target.value)} />
              </div>
              <div className="pd-form-group">
                <label className="pd-label">End Time</label>
                <input type="time" className="pd-input" value={end} onChange={e => setEnd(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="pd-section-card">
            <div className="pd-section-card-title">Blocked Dates</div>
            <div className="pd-date-add-row">
              <div className="pd-form-group">
                <label className="pd-label">Select Date to Block</label>
                <input type="date" className="pd-input" value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setNewDate(e.target.value)} />
              </div>
              <button type="button" className="pd-btn pd-btn-outline"
                onClick={addDate} disabled={!newDate} style={{whiteSpace:'nowrap',marginBottom:14}}>
                Block This Date
              </button>
            </div>
            {blocked.length > 0 && (
              <div className="pd-blocked-list">
                {blocked.map(dt => (
                  <div key={dt} className="pd-blocked-chip">
                    {new Date(dt + 'T12:00:00').toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})}
                    <button onClick={() => setBlocked(prev => prev.filter(d => d !== dt))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="pd-btn pd-btn-primary" onClick={handleSave} disabled={saving} style={{minWidth:180}}>
            {saving ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><polyline points="20 6 9 17 4 12"/></svg>Saving…</> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Availability</>}
          </button>
          <Toast msg={toast} />
        </div>
      );
    }

    /* ==============================================================
       TAB: PACKAGES
       ============================================================== */
    function PackagesTab() {
      const TIERS = [
        { key:'Basic',    label:'Basic',    cls:'pd-tier-basic'    },
        { key:'Standard', label:'Standard', cls:'pd-tier-standard' },
        { key:'Premium',  label:'Premium',  cls:'pd-tier-premium'  },
      ];
      const empty = () => ({ price:'', duration:'', features:'', active:true, _id:null });
      const [pkgs, setPkgs]     = useState({ Basic:empty(), Standard:empty(), Premium:empty() });
      const [loading, setLoading] = useState(true);
      const [saving,  setSaving]  = useState({});
      const [toast, showToast]    = useToast();
      const user   = getUser();
      const userId = user?._id || user?.id;

      useEffect(() => {
        api(`/api/packages/${userId}`).then(d => {
          const list = d?.packages || d?.data || [];
          setPkgs(prev => {
            const updated = { ...prev };
            list.forEach(p => {
              if (updated[p.name] !== undefined) {
                updated[p.name] = {
                  price:    p.price || '',
                  duration: p.duration || '',
                  features: Array.isArray(p.features) ? p.features.join('\n') : (p.features || ''),
                  active:   p.active !== false,
                  _id:      p._id,
                };
              }
            });
            return updated;
          });
          setLoading(false);
        }).catch(() => setLoading(false));
      }, [userId]);

      const update = (tier, field, val) =>
        setPkgs(prev => ({ ...prev, [tier]: { ...prev[tier], [field]: val } }));

      const save = async (tier) => {
        setSaving(s => ({...s, [tier]:true}));
        const p = pkgs[tier];
        const body = {
          name: tier,
          price: Number(p.price) || 0,
          duration: Number(p.duration) || 0,
          features: p.features.split('\n').map(f => f.trim()).filter(Boolean),
          active: p.active,
        };
        let d;
        if (p._id) {
          d = await api(`/api/packages/${p._id}`, { method:'PUT', body:JSON.stringify(body) });
        } else {
          d = await api('/api/packages', { method:'POST', body:JSON.stringify(body) });
          const newId = d?.package?._id || d?.data?._id;
          if (newId) setPkgs(prev => ({ ...prev, [tier]: { ...prev[tier], _id: newId } }));
        }
        setSaving(s => ({...s, [tier]:false}));
        showToast(d?.success || d?.package || d?.data ? `✓ ${tier} package saved!` : `✗ Failed to save ${tier}`);
      };

      if (loading) return <><h1 className="pd-page-title"><span>Packages</span></h1><Loading /></>;

      return (
        <div>
          <h1 className="pd-page-title"><span>Packages</span></h1>
          <div className="pd-packages-grid">
            {TIERS.map(({ key, label, cls }) => {
              const p = pkgs[key];
              return (
                <div key={key} className="pd-package-card">
                  <div className="pd-pkg-active-row">
                    <label className="pd-toggle">
                      <input type="checkbox" checked={p.active} onChange={e => update(key,'active',e.target.checked)} />
                      <span className="pd-toggle-slider" />
                    </label>
                    <span>{p.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className={`pd-package-tier ${cls}`}>{label}</div>

                  <div className="pd-pkg-price-row">
                    <span className="pd-pkg-currency">PKR</span>
                    <input className="pd-pkg-price-input" type="number" placeholder="0"
                      value={p.price} onChange={e => update(key,'price',e.target.value)} />
                  </div>

                  <div className="pd-form-group">
                    <label className="pd-label">Duration (hours)</label>
                    <input className="pd-input" type="number" placeholder="e.g. 4"
                      value={p.duration} onChange={e => update(key,'duration',e.target.value)} />
                  </div>

                  <div className="pd-form-group">
                    <label className="pd-label">Features (one per line)</label>
                    <textarea className="pd-pkg-features"
                      placeholder={"Edited photos\nOnline gallery\nPrint copies"}
                      value={p.features} onChange={e => update(key,'features',e.target.value)} />
                  </div>

                  <button className="pd-btn pd-btn-primary pd-pkg-save-btn"
                    onClick={() => save(key)} disabled={saving[key]}>
                    {saving[key] ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><polyline points="20 6 9 17 4 12"/></svg>Saving…</> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Package</>}
                  </button>
                </div>
              );
            })}
          </div>
          <Toast msg={toast} />
        </div>
      );
    }

    /* ==============================================================
       TAB: MY ORDERS
       ============================================================== */
    function OrdersTab() {
      const [orders, setOrders]   = useState([]);
      const [loading, setLoading] = useState(true);
      const [expanded, setExpanded] = useState(null);
      const [toast, showToast]    = useToast();

      useEffect(() => {
        api('/api/orders').then(d => {
          setOrders(d?.orders || d?.data || []);
          setLoading(false);
        }).catch(() => setLoading(false));
      }, []);

      const toggle = (id) => setExpanded(prev => prev === id ? null : id);

      const updateStatus = async (orderId, status) => {
        const d = await api(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        });
        if (d?.success || d?.order) {
          setOrders(prev => prev.map(o => o._id === orderId ? { ...o, bookingStatus: status, status } : o));
          showToast(`✓ Order ${status}`);
        } else {
          /* fallback: try cancel endpoint */
          if (status === 'cancelled') {
            const d2 = await api(`/api/orders/${orderId}/cancel`, { method:'PATCH', body:JSON.stringify({}) });
            if (d2?.success) {
              setOrders(prev => prev.map(o => o._id === orderId ? { ...o, bookingStatus:'cancelled', status:'cancelled' } : o));
              showToast('✓ Order cancelled');
            }
          }
        }
      };

      return (
        <div>
          <h1 className="pd-page-title"><span>My Orders</span></h1>
          {loading ? <Loading /> : orders.length === 0
            ? <div className="pd-section-card"><Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} text="No orders yet" /></div>
            : (
              <div className="pd-table-wrap">
                <table className="pd-table">
                  <thead><tr>
                    <th style={{width:36}}></th>
                    <th>Customer</th><th>Event</th><th>Date</th>
                    <th>Amount</th><th>Status</th>
                  </tr></thead>
                  <tbody>
                    {orders.map(o => {
                      const st = o.bookingStatus || o.status || 'pending';
                      const isOpen = expanded === o._id;
                      return (
                        <React.Fragment key={o._id}>
                          <tr>
                            <td>
                              <span className="pd-expand-toggle" onClick={() => toggle(o._id)}>
                                {isOpen ? '▲' : '▼'}
                              </span>
                            </td>
                            <td>{o.customerId?.name || o.customerName || '—'}</td>
                            <td>{o.eventType || '—'}</td>
                            <td>{fmtDate(o.eventDate)}</td>
                            <td style={{fontFamily:'Caveat,cursive',fontSize:16,fontWeight:700}}>{fmt(o.totalAmount)}</td>
                            <td><StatusBadge status={st} /></td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={6} className="pd-order-expand-td">
                                <div className="pd-order-detail-grid">
                                  <div>
                                    <div className="pd-detail-label">Order ID</div>
                                    <div className="pd-detail-value" style={{fontSize:12,fontFamily:'monospace'}}>{o._id}</div>
                                  </div>
                                  <div>
                                    <div className="pd-detail-label">Location</div>
                                    <div className="pd-detail-value">{o.location || o.city || '—'}</div>
                                  </div>
                                  <div>
                                    <div className="pd-detail-label">Package</div>
                                    <div className="pd-detail-value">{o.packageName || o.package || '—'}</div>
                                  </div>
                                  <div>
                                    <div className="pd-detail-label">Payment Status</div>
                                    <div className="pd-detail-value">{o.paymentStatus || '—'}</div>
                                  </div>
                                  <div>
                                    <div className="pd-detail-label">Your Earning</div>
                                    <div className="pd-detail-value" style={{color:'#4a7c59',fontWeight:700}}>
                                      {fmt(Math.round((o.totalAmount || 0) * 0.85))}
                                    </div>
                                  </div>
                                  {o.notes && (
                                    <div style={{gridColumn:'1/-1'}}>
                                      <div className="pd-detail-label">Customer Notes</div>
                                      <div className="pd-detail-value">{o.notes}</div>
                                    </div>
                                  )}
                                </div>
                                {st === 'pending' && (
                                  <div className="pd-order-actions">
                                    <button className="pd-btn pd-btn-success" onClick={() => updateStatus(o._id,'confirmed')}>✓ Accept</button>
                                    <button className="pd-btn pd-btn-danger"  onClick={() => updateStatus(o._id,'cancelled')}>✕ Decline</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          <Toast msg={toast} />
        </div>
      );
    }

    /* ==============================================================
       TAB: EARNINGS
       ============================================================== */
    function EarningsTab() {
      const [data, setData]       = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        api('/api/commission/earnings').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
      }, []);

      const total   = data?.totalRevenue        || 0;
      const fee     = data?.platformFee         || Math.round(total * 0.15);
      const earning = data?.photographerEarning || Math.round(total * 0.85);
      const monthly = data?.monthlyBreakdown    || [];

      return (
        <div>
          <h1 className="pd-page-title"><span>Earnings</span></h1>
          {loading ? <Loading /> : (
            <>
              <div className="pd-earnings-hero">
                <div className="pd-earnings-col">
                  <div className="pd-earn-label">Total Revenue</div>
                  <div className="pd-earn-value">{total >= 1000 ? (total/1000).toFixed(0)+'k' : total}</div>
                  <div className="pd-earn-sub">{fmt(total)} all-time</div>
                </div>
                <div className="pd-earnings-col amber">
                  <div className="pd-earn-label">Platform Fee (15%)</div>
                  <div className="pd-earn-value">{fee >= 1000 ? (fee/1000).toFixed(0)+'k' : fee}</div>
                  <div className="pd-earn-sub">{fmt(fee)} deducted</div>
                </div>
                <div className="pd-earnings-col green">
                  <div className="pd-earn-label">Your Earnings (85%)</div>
                  <div className="pd-earn-value">{earning >= 1000 ? (earning/1000).toFixed(0)+'k' : earning}</div>
                  <div className="pd-earn-sub">{fmt(earning)} yours</div>
                </div>
              </div>

              {monthly.length > 0 ? (
                <div className="pd-table-wrap">
                  <div className="pd-table-head-row">
                    <span className="pd-table-title">Monthly Breakdown (Last 6 Months)</span>
                  </div>
                  <table className="pd-table">
                    <thead><tr>
                      <th>Month</th><th>Booking Revenue</th><th>Platform Fee (15%)</th><th>Your Earning (85%)</th>
                    </tr></thead>
                    <tbody>
                      {monthly.slice(0,6).map(m => {
                        const rev  = m.amount || m.revenue || 0;
                        const mFee = Math.round(rev * 0.15);
                        const mEar = Math.round(rev * 0.85);
                        return (
                          <tr key={m.month}>
                            <td style={{fontFamily:'Caveat,cursive',fontSize:18,fontWeight:700}}>{m.month}</td>
                            <td>{fmt(rev)}</td>
                            <td style={{color:'#c07c1a',fontWeight:600}}>{fmt(mFee)}</td>
                            <td style={{color:'#4a7c59',fontWeight:700,fontFamily:'Caveat,cursive',fontSize:16}}>{fmt(mEar)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pd-section-card"><Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} text="Complete bookings to see your monthly breakdown!" /></div>
              )}

              {data?.pendingOrders?.count > 0 && (
                <div className="pd-pending-banner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#c07c1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28,flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <div style={{fontWeight:700,color:'#3E2723'}}>Pending Earnings</div>
                    <div style={{fontSize:14,color:'#6d4c41'}}>
                      {data.pendingOrders.count} order{data.pendingOrders.count !== 1 ? 's' : ''} in progress —{' '}
                      {fmt(Math.round((data.pendingOrders.amount || 0) * 0.85))} awaiting completion
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    /* ==============================================================
       TAB: MY PROFILE
       ============================================================== */
    function ProfileTab() {
      const EVENT_TYPES = ['Wedding','Portrait','Corporate','Fashion','Events','Product','Architecture','Sports'];
      const [form, setForm] = useState({
        bio: '', specialization: '', city: '', state: '', country: '',
        experience: '', pricePerHour: '', eventTypes: [], serviceDescription: '',
      });
      const [loading, setLoading] = useState(true);
      const [saving, setSaving]   = useState(false);
      const [toast, showToast]    = useToast();

      useEffect(() => {
        api('/api/photographers/profile/me').then(d => {
          const p = d?.profile || {};
          setForm({
            bio:                p.bio                || '',
            specialization:     p.specialization     || '',
            city:               p.city               || '',
            state:              p.state              || '',
            country:            p.country            || '',
            experience:         p.experience         || '',
            pricePerHour:       p.pricePerHour       || '',
            eventTypes:         p.eventTypes         || [],
            serviceDescription: p.serviceDescription || '',
          });
          setLoading(false);
        }).catch(() => setLoading(false));
      }, []);

      const toggleEventType = (et) =>
        setForm(f => ({
          ...f,
          eventTypes: f.eventTypes.includes(et)
            ? f.eventTypes.filter(e => e !== et)
            : [...f.eventTypes, et],
        }));

      const handleSave = async () => {
        setSaving(true);
        const d = await api('/api/photographers/profile', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            experience:   Number(form.experience)   || 0,
            pricePerHour: Number(form.pricePerHour) || 0,
          }),
        });
        setSaving(false);
        showToast(d?.success ? '\u2713 Profile saved!' : '\u2717 Save failed — check all fields');
      };

      if (loading) return <><h1 className="pd-page-title"><span>My Profile</span></h1><Loading /></>;

      return (
        <div>
          <h1 className="pd-page-title"><span>My Profile</span></h1>

          <div className="pd-section-card">
            <div className="pd-section-card-title">Basic Information</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div className="pd-form-group" style={{ gridColumn:'1/-1' }}>
                <label className="pd-label">Bio</label>
                <textarea className="pd-input" rows={4} style={{ resize:'vertical', borderRadius:8 }}
                  placeholder="Tell clients about yourself, your style, and your passion for photography…"
                  value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>

              <div className="pd-form-group">
                <label className="pd-label">Specialization</label>
                <input className="pd-input" placeholder="e.g. Wedding Photography"
                  value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} />
              </div>

              <div className="pd-form-group">
                <label className="pd-label">Years of Experience</label>
                <input className="pd-input" type="number" min="0" placeholder="e.g. 5"
                  value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
              </div>

              <div className="pd-form-group">
                <label className="pd-label">Price Per Hour (PKR)</label>
                <input className="pd-input" type="number" min="0" placeholder="e.g. 5000"
                  value={form.pricePerHour} onChange={e => setForm(f => ({ ...f, pricePerHour: e.target.value }))} />
              </div>

              <div className="pd-form-group">
                <label className="pd-label">City</label>
                <input className="pd-input" placeholder="e.g. Lahore"
                  value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>

              <div className="pd-form-group">
                <label className="pd-label">State / Province</label>
                <input className="pd-input" placeholder="e.g. Punjab"
                  value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
              </div>

              <div className="pd-form-group">
                <label className="pd-label">Country</label>
                <input className="pd-input" placeholder="e.g. Pakistan"
                  value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
            </div>

            <div className="pd-form-group" style={{ marginTop: 6 }}>
              <label className="pd-label">Event Types You Cover</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:9, marginTop:8 }}>
                {EVENT_TYPES.map(et => (
                  <button key={et} type="button"
                    className={`pd-day-pill${form.eventTypes.includes(et) ? ' active' : ''}`}
                    onClick={() => toggleEventType(et)}>
                    {et}
                  </button>
                ))}
              </div>
            </div>

            <div className="pd-form-group">
              <label className="pd-label">Service Description</label>
              <textarea className="pd-input" rows={4} style={{ resize:'vertical', borderRadius:8 }}
                placeholder="Detailed description of your services shown on your public profile…"
                value={form.serviceDescription} onChange={e => setForm(f => ({ ...f, serviceDescription: e.target.value }))} />
            </div>

            <button className="pd-btn pd-btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop:8 }}>
              {saving
                ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><polyline points="20 6 9 17 4 12"/></svg>Saving\u2026</>
                : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14,verticalAlign:'middle',marginRight:5}}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Profile</>}
            </button>
          </div>
          <Toast msg={toast} />
        </div>
      );
    }

    /* ==============================================================
       TAB: REVIEWS
       ============================================================== */
    function ReviewsTab() {
      const [reviews, setReviews] = useState([]);
      const [loading, setLoading] = useState(true);
      const user   = getUser();
      const userId = user?._id || user?.id;

      useEffect(() => {
        api(`/api/reviews/${userId}`).then(d => {
          setReviews(d?.reviews || []);
          setLoading(false);
        }).catch(() => setLoading(false));
      }, [userId]);

      const avgRating = reviews.length
        ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
        : null;

      function Stars({ rating }) {
        return (
          <span>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < Math.round(rating) ? '#D84315' : '#c9b499', fontSize: 17 }}>\u2605</span>
            ))}
          </span>
        );
      }

      if (loading) return <><h1 className="pd-page-title"><span>Reviews</span></h1><Loading /></>;

      return (
        <div>
          <h1 className="pd-page-title"><span>Reviews ({reviews.length})</span></h1>

          {reviews.length === 0 ? (
            <div className="pd-section-card">
              <Empty icon={<svg viewBox="0 0 24 24" fill="none" stroke="#D84315" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:40,height:40}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                text="No reviews yet — complete bookings to receive reviews!" />
            </div>
          ) : (
            <>
              <div className="pd-stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
                <div className="pd-stat-card terra">
                  <div className="pd-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                  <div className="pd-stat-label">Average Rating</div>
                  <div className="pd-stat-value">{avgRating} \u2605</div>
                  <div className="pd-stat-sub">out of 5.0</div>
                </div>
                <div className="pd-stat-card blue">
                  <div className="pd-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div>
                  <div className="pd-stat-label">Total Reviews</div>
                  <div className="pd-stat-value">{reviews.length}</div>
                  <div className="pd-stat-sub">from customers</div>
                </div>
                <div className="pd-stat-card green">
                  <div className="pd-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg></div>
                  <div className="pd-stat-label">5-Star Reviews</div>
                  <div className="pd-stat-value">{reviews.filter(r => r.rating === 5).length}</div>
                  <div className="pd-stat-sub">excellent ratings</div>
                </div>
              </div>

              <div className="pd-table-wrap">
                <div className="pd-table-head-row">
                  <span className="pd-table-title">All Reviews</span>
                </div>
                {reviews.map(r => (
                  <div key={r._id} style={{ padding:'16px 20px', borderBottom:'1px solid rgba(62,39,35,0.08)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:38, height:38, borderRadius:'50%', background:'#D84315',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'#FDFBF7', fontFamily:'Caveat,cursive', fontSize:16, fontWeight:700,
                          flexShrink:0, border:'2px solid #3E2723'
                        }}>
                          {(r.customerId?.name || r.customerName || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14 }}>{r.customerId?.name || r.customerName || 'Customer'}</div>
                          <div style={{ fontSize:12, color:'#8a6552' }}>{fmtDate(r.createdAt)}</div>
                        </div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment && (
                      <div style={{ fontSize:14, color:'#3E2723', lineHeight:1.7, fontStyle:'italic', paddingLeft:48, paddingRight:8 }}>
                        &#8220;{r.comment}&#8221;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    /* ==============================================================
       SIDEBAR
       ============================================================== */
    const NAV = [
      { id:'overview',     label:'Overview',     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
      { id:'profile',      label:'My Profile',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
      { id:'portfolio',    label:'Portfolio',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
      { id:'availability', label:'Availability', icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
      { id:'packages',     label:'Packages',     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
      { id:'reviews',      label:'Reviews',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
      { id:'orders',       label:'My Orders',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
      { id:'earnings',     label:'Earnings',     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    ];

    function Sidebar({ tab, setTab, user }) {
      const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      };
      const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
        : 'PH';
      return (
        <aside className="pd-sidebar">
          <div className="pd-sidebar-logo">
            <div className="pd-logo-icon">
              <svg viewBox="0 0 48 48" fill="none" width="20" height="20">
                <path d="M5 16L5 40C5 41.5 6.5 43 8 43L40 43C41.5 43 43 41.5 43 40L43 16C43 14.5 41.5 13 40 13L8 13C6.5 13 5 14.5 5 16Z" stroke="#FDFBF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="24" cy="28" r="8" stroke="#FDFBF7" strokeWidth="2"/>
                <circle cx="24" cy="28" r="3" stroke="#D84315" strokeWidth="1.8"/>
                <path d="M18 13L20 7L28 7L30 13" stroke="#FDFBF7" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="pd-logo-text">SnapBook</span>
          </div>
          <div className="pd-sidebar-avatar">
            <div className="pd-avatar-circle">
              {user?.profileImage ? <img src={user.profileImage} alt="avatar" /> : initials}
            </div>
            <div className="pd-avatar-name">{user?.name || 'Photographer'}</div>
            <div className="pd-avatar-role">Photographer</div>
          </div>
          <nav className="pd-nav">
            {NAV.map(item => (
              <button key={item.id} className={`pd-nav-item${tab === item.id ? ' active' : ''}`}
                onClick={() => setTab(item.id)}>
                <span className="pd-nav-icon">{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
          <div className="pd-sidebar-footer">
            <button className="pd-logout-btn" onClick={logout}>↩ Logout</button>
          </div>
        </aside>
      );
    }

    /* ==============================================================
       APP ROOT
       ============================================================== */
    function App() {
      const [tab, setTab] = useState('overview');

      /* Auth guard */
      if (!getToken()) { window.location.href = '/login'; return null; }
      const user = getUser();
      if (user && user.role !== 'photographer') { window.location.href = '/'; return null; }

      const TABS = {
        overview:     OverviewTab,
        profile:      ProfileTab,
        portfolio:    PortfolioTab,
        availability: AvailabilityTab,
        packages:     PackagesTab,
        reviews:      ReviewsTab,
        orders:       OrdersTab,
        earnings:     EarningsTab,
      };
      const TabContent = TABS[tab] || OverviewTab;

      return (
        <div className="pd-layout">
          <Sidebar tab={tab} setTab={setTab} user={user} />
          <main className="pd-main">
            <TabContent />
          </main>
          <Chatbot />
        </div>
      );
    }

export default App;
