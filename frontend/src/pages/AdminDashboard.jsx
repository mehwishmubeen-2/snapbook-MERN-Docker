import { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import './admin-dashboard.css';

/* ─── Utilities ─────────────────────────────────────────────── */
    const getToken = () => localStorage.getItem('token');

    const api = async (method, path, body = null) => {
      try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        const token = getToken();
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch('/api' + path, opts);
        if (res.status === 401) { window.location.href = '/login'; return null; }
        return res.json();
      } catch (e) { console.error('API error', path, e); return null; }
    };

    const fmtPKR  = n  => 'PKR ' + Number(n || 0).toLocaleString('en-PK');
    const fmtDate = d  => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const trunc   = (s, n = 58) => s && s.length > n ? s.slice(0, n) + '…' : (s || '—');
    const initials = name => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

    /* ─── Shared: Avatar cell ────────────────────────────────────── */
    function AvCell({ name, src }) {
      return (
        <div className="ad-av-cell">
          <div className="ad-av">
            {src
              ? <img src={src} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />
              : initials(name)}
          </div>
          <span className="ad-av-name">{name || '—'}</span>
        </div>
      );
    }

    /* ─── Badges ─────────────────────────────────────────────────── */
    function StatusBadge({ status }) {
      const map = {
        open: ['red','Open'], 'in-progress': ['amber','In Progress'], resolved: ['green','Resolved'],
        pending: ['amber','Pending'], approved: ['green','Approved'],
        suspended: ['red','Suspended'], rejected: ['gray','Rejected'],
        active: ['green','Active'], inactive: ['gray','Inactive'],
        paid: ['green','Paid'], unpaid: ['amber','Unpaid'],
      };
      const [cls, lbl] = map[status] || ['gray', status || '—'];
      return <span className={`ad-badge ad-badge-${cls}`}>{lbl}</span>;
    }

    function PriorityBadge({ priority }) {
      const map = { high: 'red', medium: 'amber', low: 'gray' };
      return <span className={`ad-badge ad-badge-${map[priority] || 'gray'}`}>{priority || 'low'}</span>;
    }

    /* ─── DASHBOARD TAB ──────────────────────────────────────────── */
    function DashboardTab() {
      const [photographers, setPhotographers] = useState([]);
      const [commData, setCommData]   = useState(null);
      const [disputes, setDisputes]   = useState([]);
      const [loading, setLoading]     = useState(true);
      const [actLoading, setActLoading] = useState({});

      useEffect(() => {
        Promise.all([
          api('GET', '/admin/photographers'),
          api('GET', '/commission/platform'),
          api('GET', '/disputes'),
        ]).then(([ph, comm, disp]) => {
          setPhotographers(Array.isArray(ph) ? ph : (ph?.photographers || []));
          if (comm?.success) setCommData(comm);
          if (disp?.success) setDisputes(disp.disputes || []);
          setLoading(false);
        });
      }, []);

      const doAction = async (id, action) => {
        const key = id + action;
        setActLoading(p => ({ ...p, [key]: true }));
        await api('PATCH', `/admin/photographers/${id}/${action}`);
        const res = await api('GET', '/admin/photographers');
        setPhotographers(Array.isArray(res) ? res : (res?.photographers || []));
        setActLoading(p => { const n = { ...p }; delete n[key]; return n; });
      };

      if (loading) return <div className="ad-loading">Loading dashboard…</div>;

      const pending      = photographers.filter(p => !p.isApproved);
      const active       = photographers.filter(p => p.isApproved && p.isActive !== false);
      const openDisputes = disputes.filter(d => d.status !== 'resolved');

      return (
        <div>
          <div className="ad-stats-grid">
            <div className="ad-stat amber">
              <div className="ad-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              <div className="ad-stat-label">Pending Approvals</div>
              <div className="ad-stat-val">{pending.length}</div>
              <div className="ad-stat-sub">awaiting review</div>
            </div>
            <div className="ad-stat blue">
              <div className="ad-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
              <div className="ad-stat-label">Active Photographers</div>
              <div className="ad-stat-val">{active.length}</div>
              <div className="ad-stat-sub">on platform</div>
            </div>
            <div className="ad-stat green">
              <div className="ad-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
              <div className="ad-stat-label">Platform Revenue</div>
              <div className="ad-stat-val" style={{ fontSize: 20 }}>{fmtPKR(commData?.totalPlatformFee)}</div>
              <div className="ad-stat-sub">{commData?.totalOrders || 0} total orders</div>
            </div>
            <div className="ad-stat red">
              <div className="ad-stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <div className="ad-stat-label">Open Disputes</div>
              <div className="ad-stat-val">{openDisputes.length}</div>
              <div className="ad-stat-sub">{disputes.length} total</div>
            </div>
          </div>

          <div className="ad-grid-60-40">
            <div className="ad-card">
              <div className="ad-card-head">Recent Photographer Activity</div>
              <div className="ad-tbl-wrap">
                <table className="ad-tbl">
                  <thead><tr><th>Photographer</th><th>Orders</th><th>Revenue</th><th>Platform Fee</th></tr></thead>
                  <tbody>
                    {!(commData?.perPhotographer?.length)
                      ? <tr><td colSpan={4} className="ad-empty">No activity data yet</td></tr>
                      : commData.perPhotographer.slice(0, 8).map((p, i) => (
                        <tr key={i}>
                          <td><AvCell name={p.name} /></td>
                          <td>{p.orders}</td>
                          <td>{fmtPKR(p.revenue)}</td>
                          <td>{fmtPKR(p.platformFee)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ad-card">
              <div className="ad-card-head">Pending Approvals ({pending.length})</div>
              {pending.length === 0
                ? <div className="ad-empty">All caught up ✓</div>
                : pending.slice(0, 7).map(ph => (
                  <div key={ph._id} className="ad-pending-item">
                    <AvCell name={ph.name} src={ph.profileImage} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="ad-btn ad-btn-success ad-btn-sm" disabled={!!actLoading[ph._id + 'approve']} onClick={() => doAction(ph._id, 'approve')}>✓</button>
                      <button className="ad-btn ad-btn-danger ad-btn-sm"  disabled={!!actLoading[ph._id + 'reject']}  onClick={() => doAction(ph._id, 'reject')}>✕</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      );
    }

    /* ─── SEO MODAL ─────────────────────────────────────────────── */
    function SeoModal({ photographer, onClose }) {
      const [form, setForm]         = useState({ metaTitle: '', metaDescription: '', metaKeywords: '', seoHeading: '', slug: '' });
      const [loading, setLoading]   = useState(true);
      const [saving, setSaving]     = useState(false);
      const [generating, setGenerating] = useState(false);
      const [error, setError]       = useState('');
      const [success, setSuccess]   = useState('');
      const [aiFields, setAiFields] = useState(new Set()); // tracks which fields were AI-filled

      useEffect(() => {
        api('GET', `/admin/photographers/${photographer._id}`).then(res => {
          const profile = res?.profile || {};
          setForm({
            metaTitle:       profile.metaTitle       || '',
            metaDescription: profile.metaDescription || '',
            metaKeywords:    Array.isArray(profile.metaKeywords) ? profile.metaKeywords.join(', ') : (profile.metaKeywords || ''),
            seoHeading:      profile.seoHeading      || '',
            slug:            profile.slug            || '',
          });
          setLoading(false);
        });
      }, [photographer._id]);

      /* ── AI Generate ── */
      const generateWithAi = async () => {
        setGenerating(true); setError(''); setSuccess('');
        const res = await api('POST', `/admin/photographers/${photographer._id}/seo/generate`);
        setGenerating(false);
        if (!res?.success) {
          setError(res?.message || 'AI generation failed. Please try again.');
          return;
        }
        const s = res.suggested;
        setForm(f => ({
          metaTitle:       s.metaTitle       || f.metaTitle,
          metaDescription: s.metaDescription || f.metaDescription,
          metaKeywords:    Array.isArray(s.metaKeywords) ? s.metaKeywords.join(', ') : (s.metaKeywords || f.metaKeywords),
          seoHeading:      s.seoHeading      || f.seoHeading,
          slug:            s.slug            || f.slug,
        }));
        setAiFields(new Set(['metaTitle', 'metaDescription', 'metaKeywords', 'seoHeading', 'slug']));
        setSuccess('✨ AI has generated SEO tags based on the photographer\'s profile. Review and save.');
      };

      const save = async () => {
        if (!form.metaTitle.trim()) { setError('Meta title is required.'); return; }
        setSaving(true); setError(''); setSuccess('');
        const res = await api('PATCH', `/admin/photographers/${photographer._id}/seo`, {
          metaTitle:       form.metaTitle.trim(),
          metaDescription: form.metaDescription.trim(),
          metaKeywords:    form.metaKeywords,
          seoHeading:      form.seoHeading.trim(),
          slug:            form.slug.trim(),
        });
        setSaving(false);
        if (res?.success) { setSuccess('SEO saved successfully.'); setAiFields(new Set()); }
        else { setError(res?.message || 'Failed to save SEO data.'); }
      };

      const aiStyle = field => aiFields.has(field) ? { borderColor: '#7c3aed', boxShadow: '0 0 0 2px rgba(124,58,237,0.15)' } : {};

      return (
        <>
          <div className="ad-modal-overlay" onClick={onClose}>
            <div className="ad-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
              <div className="ad-modal-head">
                <h3>SEO Manager — {photographer.name}</h3>
                <button className="ad-drawer-x" onClick={onClose}>×</button>
              </div>
              <div className="ad-modal-body">
                {loading ? (
                  <div className="ad-loading">Loading profile…</div>
                ) : (
                  <>
                    {/* ── AI Banner ── */}
                    <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(192,124,26,0.08))', border: '2px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#3E2723' }}>✨ AI SEO Generator</div>
                        <div style={{ fontSize: 12, color: 'rgba(62,39,35,0.6)', marginTop: 2 }}>Auto-generate optimised SEO tags from this photographer's profile using Groq AI.</div>
                      </div>
                      <button
                        className="ad-btn ad-btn-sm"
                        style={{ background: generating ? '#ccc' : 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', boxShadow: '2px 2px 0 rgba(124,58,237,0.4)', minWidth: 140 }}
                        disabled={generating || saving}
                        onClick={generateWithAi}
                      >
                        {generating
                          ? <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ display:'inline-block', width:12, height:12, border:'2px solid #fff', borderTop:'2px solid transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></span>Generating…</span>
                          : '✨ Generate with AI'}
                      </button>
                    </div>

                    {aiFields.size > 0 && !success.includes('saved') && (
                      <div style={{ background: 'rgba(124,58,237,0.07)', border: '1.5px dashed #7c3aed', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#7c3aed', fontFamily: "'Caveat', cursive", fontSize: 14 }}>
                        🟣 Purple-highlighted fields were filled by AI — review them before saving.
                      </div>
                    )}

                    {error   && <div style={{ background: 'rgba(184,64,64,0.1)', border: '2px solid #b84040', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#b84040', fontSize: 13 }}>{error}</div>}
                    {success && <div style={{ background: 'rgba(74,124,89,0.1)', border: '2px solid #4a7c59', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#4a7c59', fontSize: 13 }}>{success}</div>}

                    <div className="ad-form-grp">
                      <label className="ad-label">Meta Title <span style={{ color: '#b84040' }}>*</span> {aiFields.has('metaTitle') && <span style={{ color:'#7c3aed', fontSize:10, fontWeight:700 }}>✨ AI</span>}</label>
                      <input className="ad-inp" maxLength={70} placeholder="e.g. John Doe — Wedding Photographer in Lahore" value={form.metaTitle} style={aiStyle('metaTitle')} onChange={e => { setForm(f => ({ ...f, metaTitle: e.target.value })); setAiFields(p => { const n = new Set(p); n.delete('metaTitle'); return n; }); }} />
                      <div className="ad-form-hint" style={{ display:'flex', justifyContent:'space-between' }}>
                        <span>Recommended: 50–60 characters</span>
                        <span style={{ color: form.metaTitle.length > 60 ? '#b84040' : 'inherit' }}>{form.metaTitle.length}/70</span>
                      </div>
                    </div>

                    <div className="ad-form-grp">
                      <label className="ad-label">Meta Description {aiFields.has('metaDescription') && <span style={{ color:'#7c3aed', fontSize:10, fontWeight:700 }}>✨ AI</span>}</label>
                      <textarea className="ad-ta" maxLength={160} rows={3} placeholder="Brief description for search engines…" value={form.metaDescription} style={aiStyle('metaDescription')} onChange={e => { setForm(f => ({ ...f, metaDescription: e.target.value })); setAiFields(p => { const n = new Set(p); n.delete('metaDescription'); return n; }); }} />
                      <div className="ad-form-hint" style={{ display:'flex', justifyContent:'space-between' }}>
                        <span>Recommended: 120–158 characters</span>
                        <span style={{ color: form.metaDescription.length > 158 ? '#b84040' : 'inherit' }}>{form.metaDescription.length}/160</span>
                      </div>
                    </div>

                    <div className="ad-form-grp">
                      <label className="ad-label">Meta Keywords {aiFields.has('metaKeywords') && <span style={{ color:'#7c3aed', fontSize:10, fontWeight:700 }}>✨ AI</span>}</label>
                      <input className="ad-inp" placeholder="wedding photographer, lahore, portrait" value={form.metaKeywords} style={aiStyle('metaKeywords')} onChange={e => { setForm(f => ({ ...f, metaKeywords: e.target.value })); setAiFields(p => { const n = new Set(p); n.delete('metaKeywords'); return n; }); }} />
                      <div className="ad-form-hint">Comma-separated · {form.metaKeywords.split(',').filter(k => k.trim()).length} keywords</div>
                    </div>

                    <div className="ad-form-row">
                      <div className="ad-form-grp">
                        <label className="ad-label">SEO Heading (H1) {aiFields.has('seoHeading') && <span style={{ color:'#7c3aed', fontSize:10, fontWeight:700 }}>✨ AI</span>}</label>
                        <input className="ad-inp" placeholder="e.g. Professional Wedding Photographer" value={form.seoHeading} style={aiStyle('seoHeading')} onChange={e => { setForm(f => ({ ...f, seoHeading: e.target.value })); setAiFields(p => { const n = new Set(p); n.delete('seoHeading'); return n; }); }} />
                      </div>
                      <div className="ad-form-grp">
                        <label className="ad-label">URL Slug {aiFields.has('slug') && <span style={{ color:'#7c3aed', fontSize:10, fontWeight:700 }}>✨ AI</span>}</label>
                        <input className="ad-inp" placeholder="e.g. john-doe-lahore" value={form.slug} style={aiStyle('slug')} onChange={e => { setForm(f => ({ ...f, slug: e.target.value })); setAiFields(p => { const n = new Set(p); n.delete('slug'); return n; }); }} />
                        <div className="ad-form-hint">Lowercase, hyphens only</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="ad-modal-foot">
                <button className="ad-btn ad-btn-ghost" onClick={onClose}>Cancel</button>
                <button className="ad-btn ad-btn-primary" disabled={saving || loading || generating} onClick={save}>
                  {saving ? 'Saving…' : 'Save SEO'}
                </button>
              </div>
            </div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      );
    }

    /* ─── PHOTOGRAPHERS TAB ──────────────────────────────────────── */
    function PhotographersTab() {
      const [photographers, setPhotographers] = useState([]);
      const [search, setSearch]     = useState('');
      const [loading, setLoading]   = useState(true);
      const [actLoading, setActLoading] = useState({});
      const [seoTarget, setSeoTarget] = useState(null);

      const fetchAll = async () => {
        const res = await api('GET', '/admin/photographers');
        setPhotographers(Array.isArray(res) ? res : (res?.photographers || []));
        setLoading(false);
      };
      useEffect(() => { fetchAll(); }, []);

      const doAction = async (id, action) => {
        const key = id + action;
        setActLoading(p => ({ ...p, [key]: true }));
        await api('PATCH', `/admin/photographers/${id}/${action}`);
        await fetchAll();
        setActLoading(p => { const n = { ...p }; delete n[key]; return n; });
      };

      const getStatus = ph => !ph.isActive ? 'suspended' : ph.isApproved ? 'approved' : 'pending';

      const filtered = photographers.filter(ph =>
        !search || ph.name?.toLowerCase().includes(search.toLowerCase()) || ph.email?.toLowerCase().includes(search.toLowerCase())
      );

      if (loading) return <div className="ad-loading">Loading photographers…</div>;

      return (
        <div>
          <div className="ad-sec-head">
            <div className="ad-sec-title">Photographers ({photographers.length})</div>
          </div>
          <div className="ad-card">
            <div className="ad-search">
              <input className="ad-search-inp" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="ad-tbl-wrap">
              <table className="ad-tbl">
                <thead><tr><th>Photographer</th><th>Email</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={5} className="ad-empty">No photographers found</td></tr>}
                  {filtered.map(ph => {
                    const status = getStatus(ph);
                    return (
                      <tr key={ph._id}>
                        <td><AvCell name={ph.name} src={ph.profileImage} /></td>
                        <td style={{ color: 'rgba(62,39,35,0.65)', fontSize: 13 }}>{ph.email}</td>
                        <td><StatusBadge status={status} /></td>
                        <td style={{ color: 'rgba(62,39,35,0.55)', fontSize: 12.5 }}>{fmtDate(ph.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {status === 'pending' && <>
                              <button className="ad-btn ad-btn-success ad-btn-sm" disabled={!!actLoading[ph._id+'approve']} onClick={() => doAction(ph._id, 'approve')}>Approve</button>
                              <button className="ad-btn ad-btn-danger  ad-btn-sm" disabled={!!actLoading[ph._id+'reject']}  onClick={() => doAction(ph._id, 'reject')}>Reject</button>
                            </>}
                            {status === 'approved' && (
                              <button className="ad-btn ad-btn-amber ad-btn-sm" disabled={!!actLoading[ph._id+'suspend']} onClick={() => doAction(ph._id, 'suspend')}>Suspend</button>
                            )}
                            {status === 'suspended' && (
                              <button className="ad-btn ad-btn-success ad-btn-sm" disabled={!!actLoading[ph._id+'approve']} onClick={() => doAction(ph._id, 'approve')}>Reinstate</button>
                            )}
                            <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{ borderColor: '#1565c0', color: '#1565c0' }} onClick={() => setSeoTarget(ph)}>
                              ✦ SEO
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {seoTarget && <SeoModal photographer={seoTarget} onClose={() => setSeoTarget(null)} />}
        </div>
      );
    }

    /* ─── USERS TAB ──────────────────────────────────────────────── */
    function UsersTab() {
      const [photographers, setPhotographers] = useState([]);
      const [search, setSearch]   = useState('');
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        api('GET', '/admin/photographers').then(res => {
          setPhotographers(Array.isArray(res) ? res : (res?.photographers || []));
          setLoading(false);
        });
      }, []);

      const filtered = photographers.filter(ph =>
        !search || ph.name?.toLowerCase().includes(search.toLowerCase()) || ph.email?.toLowerCase().includes(search.toLowerCase())
      );

      if (loading) return <div className="ad-loading">Loading users…</div>;

      return (
        <div>
          <div className="ad-sec-head"><div className="ad-sec-title">Registered Users</div></div>
          <div className="ad-note-box">
            ℹ️ Customer account management is not yet available via API. Showing photographer accounts below.
          </div>
          <div className="ad-card">
            <div className="ad-search">
              <input className="ad-search-inp" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="ad-tbl-wrap">
              <table className="ad-tbl">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={5} className="ad-empty">No users found</td></tr>}
                  {filtered.map(ph => (
                    <tr key={ph._id}>
                      <td><AvCell name={ph.name} src={ph.profileImage} /></td>
                      <td style={{ color: 'rgba(62,39,35,0.65)', fontSize: 13 }}>{ph.email}</td>
                      <td><span className="ad-badge ad-badge-blue">Photographer</span></td>
                      <td><StatusBadge status={ph.isApproved && ph.isActive !== false ? 'active' : !ph.isActive ? 'suspended' : 'pending'} /></td>
                      <td style={{ color: 'rgba(62,39,35,0.55)', fontSize: 12.5 }}>{fmtDate(ph.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    /* ─── ANALYTICS TAB ──────────────────────────────────────────── */
    function AnalyticsTab() {
      const [data, setData]   = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      // chart refs
      const lineRef = useRef(null); const barRef = useRef(null);
      const pieRef  = useRef(null); const doughRef = useRef(null);
      const userRef = useRef(null);
      const lineChart = useRef(null); const barChart = useRef(null);
      const pieChart  = useRef(null); const doughChart = useRef(null);
      const userChart = useRef(null);

      useEffect(() => {
        api('GET', '/admin/analytics').then(d => {
          if (d?.success) setData(d);
          else setError(d?.message || 'Failed to load analytics');
          setLoading(false);
        });
      }, []);

      useEffect(() => {
        if (!data) return;

        // destroy previous charts
        [lineChart, barChart, pieChart, doughChart, userChart].forEach(c => {
          if (c.current) { c.current.destroy(); c.current = null; }
        });

        const CHART_COLORS = ['#D84315','#c07c1a','#3E2723','#4a7c59','#b84040','#2e6da4','#8e44ad','#16a085'];

        // ── Monthly Revenue + Orders trend (Line + Bar combo) ────────────
        if (lineRef.current && data.monthlyTrend?.length) {
          const labels   = data.monthlyTrend.map(m => m.month);
          const revenues = data.monthlyTrend.map(m => m.revenue);
          const orders   = data.monthlyTrend.map(m => m.orders);
          lineChart.current = new Chart(lineRef.current, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                { type: 'line', label: 'Revenue (PKR)', data: revenues, borderColor: '#D84315', backgroundColor: 'rgba(216,67,21,0.15)', borderWidth: 2.5, tension: 0.4, fill: true, pointBackgroundColor: '#D84315', pointRadius: 4, yAxisID: 'y' },
                { type: 'bar',  label: 'Orders',        data: orders,   backgroundColor: 'rgba(62,39,35,0.7)', borderRadius: 4, yAxisID: 'y1' },
              ],
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { font: { family: 'Inter', size: 11 } } } },
              scales: {
                y:  { type: 'linear', position: 'left',  beginAtZero: true, grid: { color: 'rgba(62,39,35,0.07)' }, ticks: { callback: v => 'PKR ' + v.toLocaleString('en-PK') } },
                y1: { type: 'linear', position: 'right', beginAtZero: true, grid: { display: false }, ticks: { stepSize: 1 } },
                x:  { grid: { display: false } },
              },
            },
          });
        }

        // ── Top 10 Photographers by Bookings (Horizontal Bar) ───────────
        if (barRef.current && data.topByBookings?.length) {
          const top = data.topByBookings.slice(0, 10);
          barChart.current = new Chart(barRef.current, {
            type: 'bar',
            data: {
              labels: top.map(p => p.name || 'Unknown'),
              datasets: [
                { label: 'Total Bookings',     data: top.map(p => p.totalBookings),     backgroundColor: '#3E2723', borderRadius: 4 },
                { label: 'Completed Bookings', data: top.map(p => p.completedBookings), backgroundColor: '#D84315', borderRadius: 4 },
              ],
            },
            options: {
              indexAxis: 'y',
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { font: { family: 'Inter', size: 11 } } } },
              scales: { x: { beginAtZero: true, grid: { color: 'rgba(62,39,35,0.07)' } }, y: { grid: { display: false } } },
            },
          });
        }

        // ── Revenue by Event Category (Doughnut) ─────────────────────────
        if (pieRef.current && data.revenueByCategory?.length) {
          const cats = data.revenueByCategory.slice(0, 8);
          pieChart.current = new Chart(pieRef.current, {
            type: 'doughnut',
            data: {
              labels: cats.map(c => c.category),
              datasets: [{ data: cats.map(c => c.revenue), backgroundColor: CHART_COLORS, borderWidth: 2, borderColor: '#faf3e8' }],
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, padding: 10 } },
                tooltip: { callbacks: { label: ctx => ' PKR ' + Number(ctx.raw || 0).toLocaleString('en-PK') } },
              },
            },
          });
        }

        // ── Order Status Breakdown (Doughnut) ───────────────────────────
        if (doughRef.current && data.orderStatusBreakdown?.length) {
          const sb = data.orderStatusBreakdown;
          const statusColors = { completed: '#4a7c59', pending: '#c07c1a', confirmed: '#2e6da4', 'in-progress': '#8e44ad', cancelled: '#b84040' };
          doughChart.current = new Chart(doughRef.current, {
            type: 'doughnut',
            data: {
              labels: sb.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
              datasets: [{ data: sb.map(s => s.count), backgroundColor: sb.map(s => statusColors[s.status] || '#888'), borderWidth: 2, borderColor: '#faf3e8' }],
            },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, padding: 10 } } },
            },
          });
        }

        // ── New Users per Month (Stacked Bar) ───────────────────────────
        if (userRef.current && data.newUsersMonthly?.length) {
          // Build month labels (unique, sorted)
          const monthSet = [...new Set(data.newUsersMonthly.map(u => u.month))];
          const roles = [...new Set(data.newUsersMonthly.map(u => u.role))];
          const roleColors = { customer: '#c07c1a', photographer: '#D84315', admin: '#3E2723' };
          const datasets = roles.map(role => ({
            label: role.charAt(0).toUpperCase() + role.slice(1) + 's',
            data: monthSet.map(m => {
              const entry = data.newUsersMonthly.find(u => u.month === m && u.role === role);
              return entry ? entry.count : 0;
            }),
            backgroundColor: roleColors[role] || '#888',
            borderRadius: 4,
          }));
          userChart.current = new Chart(userRef.current, {
            type: 'bar',
            data: { labels: monthSet, datasets },
            options: {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { font: { family: 'Inter', size: 11 } } } },
              scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(62,39,35,0.07)' } } },
            },
          });
        }

        return () => {
          [lineChart, barChart, pieChart, doughChart, userChart].forEach(c => { if (c.current) { c.current.destroy(); c.current = null; } });
        };
      }, [data]);

      if (loading) return <div className="ad-loading">Loading analytics…</div>;
      if (error)   return <div className="ad-loading" style={{ color: '#b84040' }}>Error: {error}</div>;

      const ov = data?.overview || {};

      return (
        <div>
          <div className="ad-sec-head"><div className="ad-sec-title">Analytics Overview</div></div>

          {/* ── KPI Cards ── */}
          <div className="ad-stats-grid" style={{ marginBottom: 20 }}>
            <div className="ad-stat green">
              <div className="ad-stat-label">Total Revenue</div>
              <div className="ad-stat-val" style={{ fontSize: 20 }}>{fmtPKR(ov.totalRevenue)}</div>
            </div>
            <div className="ad-stat amber">
              <div className="ad-stat-label">Platform Commission (15%)</div>
              <div className="ad-stat-val" style={{ fontSize: 20 }}>{fmtPKR(ov.totalPlatformFee)}</div>
            </div>
            <div className="ad-stat blue">
              <div className="ad-stat-label">Total Orders</div>
              <div className="ad-stat-val">{ov.totalOrders || 0}</div>
            </div>
            <div className="ad-stat green">
              <div className="ad-stat-label">Completed Orders</div>
              <div className="ad-stat-val">{ov.completedOrders || 0}</div>
            </div>
            <div className="ad-stat amber">
              <div className="ad-stat-label">Pending Orders</div>
              <div className="ad-stat-val">{ov.pendingOrders || 0}</div>
            </div>
            <div className="ad-stat red">
              <div className="ad-stat-label">Cancelled Orders</div>
              <div className="ad-stat-val">{ov.cancelledOrders || 0}</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-label">Total Users</div>
              <div className="ad-stat-val">{ov.totalUsers || 0}</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-label">Total Photographers</div>
              <div className="ad-stat-val">{ov.totalPhotographers || 0}</div>
            </div>
            <div className="ad-stat">
              <div className="ad-stat-label">Total Customers</div>
              <div className="ad-stat-val">{ov.totalCustomers || 0}</div>
            </div>
          </div>

          {/* ── Row 1: Monthly Trend + Orders by Status ── */}
          <div className="ad-grid-2" style={{ marginBottom: 20 }}>
            <div className="ad-card">
              <div className="ad-card-head">Monthly Revenue &amp; Orders Trend</div>
              <div className="ad-chart-wrap">
                {data.monthlyTrend?.length
                  ? <canvas ref={lineRef}></canvas>
                  : <div className="ad-empty" style={{ padding: 40, textAlign: 'center' }}>No order data yet</div>}
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-card-head">Order Status Breakdown</div>
              <div className="ad-chart-wrap">
                {data.orderStatusBreakdown?.length
                  ? <canvas ref={doughRef}></canvas>
                  : <div className="ad-empty" style={{ padding: 40, textAlign: 'center' }}>No orders yet</div>}
              </div>
            </div>
          </div>

          {/* ── Row 2: Revenue by Category + New Users ── */}
          <div className="ad-grid-2" style={{ marginBottom: 20 }}>
            <div className="ad-card">
              <div className="ad-card-head">Revenue by Event Category</div>
              <div className="ad-chart-wrap">
                {data.revenueByCategory?.length
                  ? <canvas ref={pieRef}></canvas>
                  : <div className="ad-empty" style={{ padding: 40, textAlign: 'center' }}>No completed orders yet</div>}
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-card-head">New Registrations per Month</div>
              <div className="ad-chart-wrap">
                {data.newUsersMonthly?.length
                  ? <canvas ref={userRef}></canvas>
                  : <div className="ad-empty" style={{ padding: 40, textAlign: 'center' }}>No registration data</div>}
              </div>
            </div>
          </div>

          {/* ── Row 3: Top Photographers by Bookings (chart) ── */}
          <div className="ad-card" style={{ marginBottom: 20 }}>
            <div className="ad-card-head">Top 10 Photographers by Bookings</div>
            <div style={{ height: 320 }}>
              {data.topByBookings?.length
                ? <canvas ref={barRef}></canvas>
                : <div className="ad-empty" style={{ padding: 40, textAlign: 'center' }}>No booking data yet</div>}
            </div>
          </div>

          {/* ── Row 4: Photographers Table sorted by Rating ── */}
          <div className="ad-card" style={{ marginBottom: 20 }}>
            <div className="ad-card-head">Photographers — Ranked by Rating (High → Low)</div>
            <div className="ad-tbl-wrap">
              <table className="ad-tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Photographer</th>
                    <th>City</th>
                    <th>Specialization</th>
                    <th>Rating</th>
                    <th>Reviews</th>
                    <th>Total Bookings</th>
                    <th>Completed</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {!(data.photographersByRating?.length)
                    ? <tr><td colSpan={9} className="ad-empty">No photographers yet</td></tr>
                    : data.photographersByRating.map((p, i) => (
                      <tr key={i}>
                        <td style={{ color: '#888', fontSize: 12 }}>{i + 1}</td>
                        <td><AvCell name={p.name} src={p.profileImage} /></td>
                        <td>{p.city || '—'}</td>
                        <td>{p.specialization || (p.eventTypes?.[0]) || '—'}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: '#c07c1a', fontWeight: 700 }}>{Number(p.rating || 0).toFixed(1)}</span>
                            <span style={{ color: '#c07c1a' }}>★</span>
                          </span>
                        </td>
                        <td>{p.totalReviews || 0}</td>
                        <td style={{ fontWeight: 600 }}>{p.totalBookings || 0}</td>
                        <td>{p.completedBookings || 0}</td>
                        <td>{fmtPKR(p.totalRevenue)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Row 5: Revenue by Category Table ── */}
          <div className="ad-grid-2">
            <div className="ad-card">
              <div className="ad-card-head">Revenue by Event Category — Detail</div>
              <div className="ad-tbl-wrap">
                <table className="ad-tbl">
                  <thead><tr><th>Category</th><th>Revenue</th><th>Platform Fee</th><th>Orders</th></tr></thead>
                  <tbody>
                    {!(data.revenueByCategory?.length)
                      ? <tr><td colSpan={4} className="ad-empty">No data</td></tr>
                      : data.revenueByCategory.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{c.category}</td>
                          <td>{fmtPKR(c.revenue)}</td>
                          <td>{fmtPKR(c.platformFee)}</td>
                          <td>{c.orders}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
            <div className="ad-card">
              <div className="ad-card-head">Monthly Trend — Detail</div>
              <div className="ad-tbl-wrap">
                <table className="ad-tbl">
                  <thead><tr><th>Month</th><th>Revenue</th><th>Platform Fee</th><th>Orders</th></tr></thead>
                  <tbody>
                    {!(data.monthlyTrend?.length)
                      ? <tr><td colSpan={4} className="ad-empty">No data yet</td></tr>
                      : [...data.monthlyTrend].reverse().map((m, i) => (
                        <tr key={i}>
                          <td>{m.month}</td>
                          <td>{fmtPKR(m.revenue)}</td>
                          <td>{fmtPKR(m.platformFee)}</td>
                          <td>{m.orders}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    }

    /* ─── DISPUTES TAB ───────────────────────────────────────────── */
    function DisputesTab() {
      const [disputes, setDisputes] = useState([]);
      const [selected, setSelected] = useState(null);
      const [drawer, setDrawer]     = useState(false);
      const [form, setForm]         = useState({ resolution: '', refundAmount: '', status: 'open' });
      const [loading, setLoading]   = useState(true);
      const [saving, setSaving]     = useState(false);

      useEffect(() => {
        api('GET', '/disputes').then(d => {
          if (d?.success) setDisputes(d.disputes || []);
          setLoading(false);
        });
      }, []);

      const openDrawer = d => {
        setSelected(d);
        setForm({ resolution: d.resolution || '', refundAmount: d.refundAmount || '', status: d.status || 'open' });
        setDrawer(true);
      };

      const save = async () => {
        if (!selected) return;
        setSaving(true);
        const res = await api('PATCH', `/disputes/${selected._id}`, {
          resolution: form.resolution,
          refundAmount: Number(form.refundAmount) || 0,
          status: form.status,
        });
        if (res?.success) {
          setDisputes(p => p.map(d => d._id === selected._id ? res.dispute : d));
          setDrawer(false);
        }
        setSaving(false);
      };

      if (loading) return <div className="ad-loading">Loading disputes…</div>;

      return (
        <div>
          <div className="ad-sec-head"><div className="ad-sec-title">Disputes ({disputes.length})</div></div>
          <div className="ad-card">
            <div className="ad-tbl-wrap">
              <table className="ad-tbl">
                <thead><tr><th>Customer</th><th>Photographer</th><th>Issue</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {disputes.length === 0 && <tr><td colSpan={6} className="ad-empty">No disputes on record</td></tr>}
                  {disputes.map(d => (
                    <tr key={d._id} className="ad-row-click" onClick={() => openDrawer(d)}>
                      <td>{d.customerId?.name || '—'}</td>
                      <td>{d.photographerId?.name || '—'}</td>
                      <td style={{ color: 'rgba(62,39,35,0.65)', fontSize: 13 }}>{trunc(d.issueDescription)}</td>
                      <td><PriorityBadge priority={d.priority} /></td>
                      <td><StatusBadge status={d.status} /></td>
                      <td style={{ fontSize: 12.5, color: 'rgba(62,39,35,0.55)' }}>{fmtDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {drawer && selected && (
            <>
              <div className="ad-overlay" onClick={() => setDrawer(false)} />
              <div className="ad-drawer">
                <div className="ad-drawer-head">
                  <h3>Dispute Details</h3>
                  <button className="ad-drawer-x" onClick={() => setDrawer(false)}>×</button>
                </div>
                <div className="ad-drawer-body">
                  <div className="ad-info-row">
                    <div className="ad-info-key">Priority</div>
                    <div className="ad-info-val"><PriorityBadge priority={selected.priority} /></div>
                  </div>
                  <div className="ad-info-row">
                    <div className="ad-info-key">Customer</div>
                    <div className="ad-info-val">{selected.customerId?.name} — {selected.customerId?.email}</div>
                  </div>
                  <div className="ad-info-row">
                    <div className="ad-info-key">Photographer</div>
                    <div className="ad-info-val">{selected.photographerId?.name} — {selected.photographerId?.email}</div>
                  </div>
                  <div className="ad-info-row">
                    <div className="ad-info-key">Filed On</div>
                    <div className="ad-info-val">{fmtDate(selected.createdAt)}</div>
                  </div>
                  <div className="ad-info-row">
                    <div className="ad-info-key">Issue Description</div>
                    <div className="ad-info-val ad-info-box" style={{ marginTop: 4 }}>{selected.issueDescription}</div>
                  </div>
                  {selected.resolvedBy && (
                    <div className="ad-info-row">
                      <div className="ad-info-key">Previously Resolved By</div>
                      <div className="ad-info-val">{selected.resolvedBy?.name || '—'}</div>
                    </div>
                  )}
                  <hr className="ad-divider" />
                  <div className="ad-form-grp">
                    <label className="ad-label">Status</label>
                    <select className="ad-sel" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="ad-form-grp">
                    <label className="ad-label">Resolution Note</label>
                    <textarea className="ad-ta" rows={4} placeholder="Describe the resolution…" value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))} />
                  </div>
                  <div className="ad-form-grp">
                    <label className="ad-label">Refund Amount (PKR)</label>
                    <input className="ad-inp" type="number" min="0" placeholder="0" value={form.refundAmount} onChange={e => setForm(f => ({ ...f, refundAmount: e.target.value }))} />
                  </div>
                </div>
                <div className="ad-drawer-foot">
                  <button className="ad-btn ad-btn-ghost" onClick={() => setDrawer(false)}>Cancel</button>
                  <button className="ad-btn ad-btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    /* ─── COMMISSION TAB ─────────────────────────────────────────── */
    function CommissionTab() {
      const [commData, setCommData] = useState(null);
      const [loading, setLoading]  = useState(true);
      const [paid, setPaid]        = useState(new Set());

      useEffect(() => {
        api('GET', '/commission/platform').then(d => {
          if (d?.success) setCommData(d);
          setLoading(false);
        });
      }, []);

      if (loading) return <div className="ad-loading">Loading commission data…</div>;
      if (!commData)  return <div className="ad-empty">No commission data available.</div>;

      const pendingAmt = (commData.perPhotographer || [])
        .filter(p => !paid.has(p.photographerId))
        .reduce((s, p) => s + (p.payout || 0), 0);

      return (
        <div>
          <div className="ad-sec-head"><div className="ad-sec-title">Commission & Payouts</div></div>
          <div className="ad-comm-row">
            <div className="ad-comm-card">
              <div className="ad-comm-lbl">Total Platform Revenue</div>
              <div className="ad-comm-val">{fmtPKR(commData.totalRevenue)}</div>
            </div>
            <div className="ad-comm-card">
              <div className="ad-comm-lbl">Platform Earnings (15%)</div>
              <div className="ad-comm-val">{fmtPKR(commData.totalPlatformFee)}</div>
            </div>
            <div className="ad-comm-card">
              <div className="ad-comm-lbl">Pending Payouts</div>
              <div className="ad-comm-val">{fmtPKR(pendingAmt)}</div>
            </div>
          </div>
          <div className="ad-card">
            <div className="ad-card-head">Photographer Payout Queue</div>
            <div className="ad-tbl-wrap">
              <table className="ad-tbl">
                <thead><tr><th>Photographer</th><th>Email</th><th>Revenue</th><th>Platform Fee (15%)</th><th>Their Payout (85%)</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {!(commData.perPhotographer?.length)
                    ? <tr><td colSpan={7} className="ad-empty">No payout data available</td></tr>
                    : commData.perPhotographer.map(ph => {
                        const isPaid = paid.has(ph.photographerId);
                        return (
                          <tr key={ph.photographerId}>
                            <td><AvCell name={ph.name} /></td>
                            <td style={{ fontSize: 12.5, color: 'rgba(62,39,35,0.65)' }}>{ph.email}</td>
                            <td>{fmtPKR(ph.revenue)}</td>
                            <td>{fmtPKR(ph.platformFee)}</td>
                            <td style={{ fontWeight: 600 }}>{fmtPKR(ph.payout)}</td>
                            <td><StatusBadge status={isPaid ? 'paid' : 'unpaid'} /></td>
                            <td>
                              {!isPaid && (
                                <button className="ad-btn ad-btn-success ad-btn-sm" onClick={() => setPaid(p => new Set([...p, ph.photographerId]))}>Mark Paid</button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    /* ─── FAQs TAB ───────────────────────────────────────────────── */
    const BLANK_FAQ = { category: 'general', question: '', answer: '', keywords: '', order: 0 };

    function FAQsTab() {
      const [faqs, setFaqs]       = useState([]);
      const [loading, setLoading] = useState(true);
      const [modal, setModal]     = useState(false);
      const [editId, setEditId]   = useState(null);
      const [form, setForm]       = useState({ ...BLANK_FAQ });
      const [saving, setSaving]   = useState(false);

      const fetchFaqs = () => api('GET', '/faq').then(d => { if (d?.success) setFaqs(d.faqs || []); setLoading(false); });
      useEffect(() => { fetchFaqs(); }, []);

      const openAdd  = () => { setForm({ ...BLANK_FAQ }); setEditId(null); setModal(true); };
      const openEdit = f  => {
        setForm({ category: f.category || 'general', question: f.question || '', answer: f.answer || '', keywords: Array.isArray(f.keywords) ? f.keywords.join(', ') : (f.keywords || ''), order: f.order ?? 0 });
        setEditId(f._id); setModal(true);
      };

      const save = async () => {
        setSaving(true);
        const body = { ...form, keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean), order: Number(form.order) };
        if (editId) await api('PUT', `/faq/${editId}`, body);
        else        await api('POST', '/faq', body);
        await fetchFaqs();
        setModal(false);
        setSaving(false);
      };

      const del = async id => {
        if (!confirm('Delete this FAQ?')) return;
        await api('DELETE', `/faq/${id}`);
        setFaqs(p => p.filter(f => f._id !== id));
      };

      const toggleActive = async faq => {
        await api('PUT', `/faq/${faq._id}`, { ...faq, active: !faq.active });
        setFaqs(p => p.map(f => f._id === faq._id ? { ...f, active: !f.active } : f));
      };

      if (loading) return <div className="ad-loading">Loading FAQs…</div>;

      return (
        <div>
          <div className="ad-sec-head">
            <div className="ad-sec-title">FAQs ({faqs.length})</div>
            <button className="ad-btn ad-btn-primary" onClick={openAdd}>+ Add FAQ</button>
          </div>
          <div className="ad-card">
            <div className="ad-tbl-wrap">
              <table className="ad-tbl">
                <thead><tr><th>Category</th><th>Question</th><th>Order</th><th>Active</th><th>Actions</th></tr></thead>
                <tbody>
                  {faqs.length === 0 && <tr><td colSpan={5} className="ad-empty">No FAQs yet — add your first one!</td></tr>}
                  {faqs.map(faq => (
                    <tr key={faq._id}>
                      <td><span className="ad-badge ad-badge-blue">{faq.category || 'general'}</span></td>
                      <td style={{ maxWidth: 340 }}>{trunc(faq.question, 80)}</td>
                      <td>{faq.order ?? 0}</td>
                      <td>
                        <label className="ad-toggle">
                          <input type="checkbox" checked={faq.active !== false} onChange={() => toggleActive(faq)} />
                          <span className="ad-slide"></span>
                        </label>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => openEdit(faq)}>Edit</button>
                          <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={() => del(faq._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {modal && (
            <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
              <div className="ad-modal">
                <div className="ad-modal-head">
                  <h3>{editId ? 'Edit FAQ' : 'Add New FAQ'}</h3>
                  <button className="ad-drawer-x" onClick={() => setModal(false)}>×</button>
                </div>
                <div className="ad-modal-body">
                  <div className="ad-form-row">
                    <div className="ad-form-grp">
                      <label className="ad-label">Category</label>
                      <select className="ad-sel" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                        <option value="general">General</option>
                        <option value="booking">Booking</option>
                        <option value="payment">Payment</option>
                        <option value="cancellation">Cancellation</option>
                        <option value="photographers">Photographers</option>
                        <option value="account">Account</option>
                      </select>
                    </div>
                    <div className="ad-form-grp">
                      <label className="ad-label">Display Order</label>
                      <input className="ad-inp" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} />
                    </div>
                  </div>
                  <div className="ad-form-grp">
                    <label className="ad-label">Question</label>
                    <input className="ad-inp" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Enter the FAQ question…" />
                  </div>
                  <div className="ad-form-grp">
                    <label className="ad-label">Answer</label>
                    <textarea className="ad-ta" rows={4} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Provide a detailed answer…" />
                  </div>
                  <div className="ad-form-grp">
                    <label className="ad-label">Keywords (comma-separated)</label>
                    <input className="ad-inp" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="booking, refund, cancel…" />
                    <div className="ad-form-hint">Used for chatbot search matching</div>
                  </div>
                </div>
                <div className="ad-modal-foot">
                  <button className="ad-btn ad-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                  <button className="ad-btn ad-btn-primary" disabled={saving || !form.question || !form.answer} onClick={save}>
                    {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add FAQ'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    /* ─── COUPONS TAB ────────────────────────────────────────────── */
    const BLANK_COUPON = { code: '', description: '', discountType: 'percentage', discountValue: '', maxDiscount: '', minOrderValue: '', maxUses: '', expiryDate: '', active: true };

    function CouponsTab() {
      const [coupons, setCoupons] = useState([]);
      const [loading, setLoading] = useState(true);
      const [modal, setModal]     = useState(false);
      const [editId, setEditId]   = useState(null);
      const [form, setForm]       = useState({ ...BLANK_COUPON });
      const [saving, setSaving]   = useState(false);

      const fetchCoupons = () => api('GET', '/coupon').then(d => { if (d?.success) setCoupons(d.coupons || []); setLoading(false); });
      useEffect(() => { fetchCoupons(); }, []);

      const openAdd  = () => { setForm({ ...BLANK_COUPON }); setEditId(null); setModal(true); };
      const openEdit = c  => {
        setForm({ code: c.code || '', description: c.description || '', discountType: c.discountType || 'percentage', discountValue: c.discountValue || '', maxDiscount: c.maxDiscount || '', minOrderValue: c.minOrderValue || '', maxUses: c.maxUses || '', active: c.active !== false, expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '' });
        setEditId(c._id); setModal(true);
      };

      const save = async () => {
        setSaving(true);
        const body = { ...form, discountValue: Number(form.discountValue), maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : undefined, maxUses: form.maxUses ? Number(form.maxUses) : undefined };
        if (editId) await api('PUT',  `/coupon/${editId}`, body);
        else        await api('POST', '/coupon', body);
        await fetchCoupons();
        setModal(false);
        setSaving(false);
      };

      const del = async id => {
        if (!confirm('Delete this coupon?')) return;
        await api('DELETE', `/coupon/${id}`);
        setCoupons(p => p.filter(c => c._id !== id));
      };

      if (loading) return <div className="ad-loading">Loading coupons…</div>;

      return (
        <div>
          <div className="ad-sec-head">
            <div className="ad-sec-title">Coupons ({coupons.length})</div>
            <button className="ad-btn ad-btn-primary" onClick={openAdd}>+ Create Coupon</button>
          </div>
          <div className="ad-card">
            <div className="ad-tbl-wrap">
              <table className="ad-tbl">
                <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Max Uses</th><th>Expiry</th><th>Active</th><th></th></tr></thead>
                <tbody>
                  {coupons.length === 0 && <tr><td colSpan={8} className="ad-empty">No coupons yet.</td></tr>}
                  {coupons.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>{c.code}</td>
                      <td><span className="ad-badge ad-badge-blue">{c.discountType}</span></td>
                      <td>{c.discountType === 'percentage' ? `${c.discountValue}%` : fmtPKR(c.discountValue)}</td>
                      <td>{c.minOrderValue ? fmtPKR(c.minOrderValue) : '—'}</td>
                      <td>{c.maxUses || '∞'}</td>
                      <td style={{ fontSize: 12.5 }}>{c.expiryDate ? fmtDate(c.expiryDate) : '—'}</td>
                      <td><span className={`ad-badge ${c.active !== false ? 'ad-badge-green' : 'ad-badge-gray'}`}>{c.active !== false ? 'Active' : 'Off'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="ad-btn ad-btn-ghost ad-btn-sm" onClick={() => openEdit(c)}>Edit</button>
                          <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={() => del(c._id)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {modal && (
            <div className="ad-modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
              <div className="ad-modal">
                <div className="ad-modal-head">
                  <h3>{editId ? 'Edit Coupon' : 'Create Coupon'}</h3>
                  <button className="ad-drawer-x" onClick={() => setModal(false)}>×</button>
                </div>
                <div className="ad-modal-body">
                  <div className="ad-form-row">
                    <div className="ad-form-grp">
                      <label className="ad-label">Coupon Code</label>
                      <input className="ad-inp" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" style={{ fontFamily: 'monospace', letterSpacing: 1 }} />
                    </div>
                    <div className="ad-form-grp">
                      <label className="ad-label">Discount Type</label>
                      <select className="ad-sel" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (PKR)</option>
                      </select>
                    </div>
                  </div>
                  <div className="ad-form-grp">
                    <label className="ad-label">Description</label>
                    <input className="ad-inp" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
                  </div>
                  <div className="ad-form-row">
                    <div className="ad-form-grp">
                      <label className="ad-label">Discount Value</label>
                      <input className="ad-inp" type="number" min="0" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '20 (%)' : '500 (PKR)'} />
                    </div>
                    <div className="ad-form-grp">
                      <label className="ad-label">Max Discount Cap (PKR)</label>
                      <input className="ad-inp" type="number" min="0" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="Optional ceiling…" />
                    </div>
                  </div>
                  <div className="ad-form-row">
                    <div className="ad-form-grp">
                      <label className="ad-label">Min Order Value (PKR)</label>
                      <input className="ad-inp" type="number" min="0" value={form.minOrderValue} onChange={e => setForm(f => ({ ...f, minOrderValue: e.target.value }))} placeholder="e.g. 1000" />
                    </div>
                    <div className="ad-form-grp">
                      <label className="ad-label">Max Uses</label>
                      <input className="ad-inp" type="number" min="0" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Leave blank = unlimited" />
                    </div>
                  </div>
                  <div className="ad-form-row">
                    <div className="ad-form-grp">
                      <label className="ad-label">Expiry Date</label>
                      <input className="ad-inp" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
                    </div>
                    <div className="ad-form-grp" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                      <label className="ad-toggle">
                        <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                        <span className="ad-slide"></span>
                      </label>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>Active</span>
                    </div>
                  </div>
                </div>
                <div className="ad-modal-foot">
                  <button className="ad-btn ad-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                  <button className="ad-btn ad-btn-primary" disabled={saving || !form.code || !form.discountValue} onClick={save}>
                    {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Coupon'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    /* ─── SETTINGS TAB ───────────────────────────────────────────── */
    function SettingsTab() {
      return (
        <div>
          <div className="ad-sec-head"><div className="ad-sec-title">Platform Settings</div></div>
          <div className="ad-card" style={{ maxWidth: 620 }}>
            <div className="ad-card-head">General Configuration</div>
            <div className="ad-form-grp">
              <label className="ad-label">Platform Name</label>
              <input className="ad-inp" defaultValue="SnapBook" />
            </div>
            <div className="ad-form-grp">
              <label className="ad-label">Platform Commission (%)</label>
              <input className="ad-inp" type="number" defaultValue="15" disabled style={{ opacity: 0.6 }} />
              <div className="ad-form-hint">Commission rate is set in backend config. Contact your developer to change it.</div>
            </div>
            <div className="ad-form-grp">
              <label className="ad-label">Support Email</label>
              <input className="ad-inp" defaultValue="support@snapbook.pk" />
            </div>
            <div className="ad-form-grp">
              <label className="ad-label">Currency</label>
              <select className="ad-sel">
                <option value="PKR">PKR — Pakistani Rupee</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>
            <div className="ad-form-actions">
              <button className="ad-btn ad-btn-primary">Save Settings</button>
            </div>
          </div>

          <div className="ad-card" style={{ maxWidth: 620, marginTop: 18 }}>
            <div className="ad-card-head">Change Admin Password</div>
            <div className="ad-form-grp">
              <label className="ad-label">Current Password</label>
              <input className="ad-inp" type="password" placeholder="••••••••" />
            </div>
            <div className="ad-form-row">
              <div className="ad-form-grp">
                <label className="ad-label">New Password</label>
                <input className="ad-inp" type="password" placeholder="••••••••" />
              </div>
              <div className="ad-form-grp">
                <label className="ad-label">Confirm New Password</label>
                <input className="ad-inp" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div className="ad-form-actions">
              <button className="ad-btn ad-btn-primary">Update Password</button>
            </div>
          </div>
        </div>
      );
    }

    /* ─── SEO QUEUE TAB ──────────────────────────────────────────── */
    function SeoQueueTab() {
      const [queue, setQueue]     = useState([]);
      const [loading, setLoading] = useState(true);
      const [acting, setActing]   = useState({});
      const [preview, setPreview] = useState(null);

      const fetchQueue = async () => {
        const res = await api('GET', '/admin/seo-queue');
        if (res?.success) setQueue(res.queue || []);
        setLoading(false);
      };
      useEffect(() => { fetchQueue(); }, []);

      const act = async (photographerId, action) => {
        const key = photographerId + action;
        setActing(p => ({ ...p, [key]: true }));
        await api('PATCH', `/admin/photographers/${photographerId}/seo/${action}`);
        await fetchQueue();
        setActing(p => { const n = { ...p }; delete n[key]; return n; });
        if (preview?._id === photographerId) setPreview(null);
      };

      if (loading) return <div className="ad-loading">Loading SEO queue…</div>;

      return (
        <div>
          <div className="ad-sec-head">
            <div className="ad-sec-title">AI SEO Approval Queue ({queue.length})</div>
          </div>

          <div className="ad-note-box" style={{ borderColor: '#7c3aed', color: '#7c3aed', background: 'rgba(124,58,237,0.06)' }}>
            ✨ When a user visits a photographer's profile for the first time, AI automatically generates optimised SEO tags.
            These appear here for your review. Approve to make them live, or reject to regenerate on the next visit.
            Until approved, the page uses instant fallback SEO built from the photographer's raw profile data.
          </div>

          {queue.length === 0 ? (
            <div className="ad-card">
              <div className="ad-empty">
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                No pending SEO tags — all caught up!
              </div>
            </div>
          ) : (
            <div className="ad-card">
              <div className="ad-tbl-wrap">
                <table className="ad-tbl">
                  <thead>
                    <tr>
                      <th>Photographer</th>
                      <th>AI Meta Title</th>
                      <th>City / Type</th>
                      <th>Generated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map(item => {
                      const ph   = item.userId || {};
                      const uid  = ph._id || item.userId;
                      return (
                        <tr key={item._id}>
                          <td><AvCell name={ph.name} src={ph.profileImage} /></td>
                          <td style={{ maxWidth: 260 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#3E2723' }}>{item.pendingMetaTitle || '—'}</div>
                            <div style={{ fontSize: 11.5, color: 'rgba(62,39,35,0.55)', marginTop: 2 }}>{item.pendingSeoHeading || ''}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12.5 }}>{item.city || '—'}</div>
                            <div style={{ fontSize: 11.5, color: 'rgba(62,39,35,0.5)' }}>{(item.eventTypes || []).slice(0, 2).join(', ')}</div>
                          </td>
                          <td style={{ fontSize: 12, color: 'rgba(62,39,35,0.55)' }}>{fmtDate(item.seoGeneratedAt)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button className="ad-btn ad-btn-ghost ad-btn-sm" style={{ borderColor: '#7c3aed', color: '#7c3aed' }} onClick={() => setPreview(item)}>
                                Preview
                              </button>
                              <button className="ad-btn ad-btn-success ad-btn-sm" disabled={!!acting[uid + 'approve']} onClick={() => act(uid, 'approve')}>
                                {acting[uid + 'approve'] ? '…' : '✓ Approve'}
                              </button>
                              <button className="ad-btn ad-btn-danger ad-btn-sm" disabled={!!acting[uid + 'reject']} onClick={() => act(uid, 'reject')}>
                                {acting[uid + 'reject'] ? '…' : '✕ Reject'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview drawer */}
          {preview && (() => {
            const ph  = preview.userId || {};
            const uid = ph._id || preview.userId;
            return (
              <>
                <div className="ad-overlay" onClick={() => setPreview(null)} />
                <div className="ad-drawer">
                  <div className="ad-drawer-head">
                    <h3>SEO Preview — {ph.name}</h3>
                    <button className="ad-drawer-x" onClick={() => setPreview(null)}>×</button>
                  </div>
                  <div className="ad-drawer-body">
                    <div style={{ background: 'rgba(124,58,237,0.06)', border: '1.5px dashed #7c3aed', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12.5, color: '#7c3aed' }}>
                      ✨ These tags were generated by Groq AI — review before approving.
                    </div>

                    <div className="ad-info-row">
                      <div className="ad-info-key">Meta Title</div>
                      <div className="ad-info-val ad-info-box">{preview.pendingMetaTitle || '—'}</div>
                      <div className="ad-form-hint" style={{ marginTop: 4 }}>{(preview.pendingMetaTitle || '').length} / 70 chars</div>
                    </div>
                    <div className="ad-info-row">
                      <div className="ad-info-key">Meta Description</div>
                      <div className="ad-info-val ad-info-box">{preview.pendingMetaDescription || '—'}</div>
                      <div className="ad-form-hint" style={{ marginTop: 4 }}>{(preview.pendingMetaDescription || '').length} / 160 chars</div>
                    </div>
                    <div className="ad-info-row">
                      <div className="ad-info-key">Meta Keywords</div>
                      <div className="ad-info-val" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {(preview.pendingMetaKeywords || []).map((kw, i) => (
                          <span key={i} style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div className="ad-info-row">
                      <div className="ad-info-key">SEO Heading (H1)</div>
                      <div className="ad-info-val ad-info-box">{preview.pendingSeoHeading || '—'}</div>
                    </div>
                    <div className="ad-info-row">
                      <div className="ad-info-key">URL Slug</div>
                      <div className="ad-info-val ad-info-box" style={{ fontFamily: 'monospace', color: '#1565c0' }}>
                        /photographer/{preview.pendingSlug || '—'}
                      </div>
                    </div>

                    <hr className="ad-divider" />

                    {/* Google SERP preview */}
                    <div className="ad-info-key" style={{ marginBottom: 8 }}>Google Search Preview</div>
                    <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '14px 16px', fontFamily: 'Arial, sans-serif' }}>
                      <div style={{ fontSize: 18, color: '#1a0dab', marginBottom: 2, lineHeight: 1.3, textDecoration: 'underline', cursor: 'pointer' }}>{preview.pendingMetaTitle || 'No title'}</div>
                      <div style={{ fontSize: 12, color: '#006621', marginBottom: 4 }}>snapbook.pk › photographer › <span style={{ color: '#006621' }}>{preview.pendingSlug || '…'}</span></div>
                      <div style={{ fontSize: 13, color: '#545454', lineHeight: 1.5 }}>{preview.pendingMetaDescription || 'No description'}</div>
                    </div>
                  </div>
                  <div className="ad-drawer-foot">
                    <button className="ad-btn ad-btn-ghost" onClick={() => setPreview(null)}>Close</button>
                    <button className="ad-btn ad-btn-danger ad-btn-sm" disabled={!!acting[uid + 'reject']} onClick={() => act(uid, 'reject')}>
                      ✕ Reject
                    </button>
                    <button className="ad-btn ad-btn-success" disabled={!!acting[uid + 'approve']} onClick={() => act(uid, 'approve')}>
                      {acting[uid + 'approve'] ? 'Approving…' : '✓ Approve & Go Live'}
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      );
    }

    /* ─── MAIN APP ───────────────────────────────────────────────── */
    const TABS = [
      { id: 'dashboard',      label: 'Dashboard',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,  section: 'overview'  },
      { id: 'photographers',  label: 'Photographers',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>, section: 'overview'  },
      { id: 'users',          label: 'Users',          icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, section: 'overview'  },
      { id: 'analytics',      label: 'Analytics',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, section: 'overview'  },
      { id: 'disputes',       label: 'Disputes',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, section: 'manage'    },
      { id: 'commission',     label: 'Commission',     icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>, section: 'manage'    },
      { id: 'faqs',           label: 'FAQs',           icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, section: 'content'   },
      { id: 'coupons',        label: 'Coupons',        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>, section: 'content'   },
      { id: 'seoqueue',       label: 'SEO Queue',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>, section: 'content'   },
      { id: 'settings',       label: 'Settings',       icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>, section: 'system'    },
    ];

    const TAB_TITLES = {
      dashboard: 'Dashboard Overview', photographers: 'Photographer Management',
      users: 'User Management', analytics: 'Analytics',
      disputes: 'Dispute Resolution', commission: 'Commission & Payouts',
      faqs: 'FAQ Management', coupons: 'Coupon Management',
      seoqueue: 'AI SEO Approval Queue', settings: 'Settings',
    };

    function AdminApp() {
      const [activeTab, setActiveTab] = useState('dashboard');
      const [adminUser, setAdminUser] = useState(null);
      const [seoQueueCount, setSeoQueueCount] = useState(0);

      useEffect(() => {
        const token = getToken();
        if (!token) { window.location.href = '/login'; return; }
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role !== 'admin') {
            alert('Access denied. Admin only.');
            window.location.href = '/login';
            return;
          }
          setAdminUser(payload);
        } catch (e) {
          window.location.href = '/login';
        }
      }, []);

      // Poll SEO queue count every 60s so the badge stays fresh
      useEffect(() => {
        const fetchCount = () => api('GET', '/admin/seo-queue').then(r => {
          if (r?.success) setSeoQueueCount(r.queue?.length || 0);
        });
        fetchCount();
        const timer = setInterval(fetchCount, 60000);
        return () => clearInterval(timer);
      }, []);

      const logout = () => { localStorage.removeItem('token'); window.location.href = '/login'; };

      const renderTab = () => {
        switch (activeTab) {
          case 'dashboard':     return <DashboardTab />;
          case 'photographers': return <PhotographersTab />;
          case 'users':         return <UsersTab />;
          case 'analytics':     return <AnalyticsTab />;
          case 'disputes':      return <DisputesTab />;
          case 'commission':    return <CommissionTab />;
          case 'faqs':          return <FAQsTab />;
          case 'coupons':       return <CouponsTab />;
          case 'seoqueue':      return <SeoQueueTab />;
          case 'settings':      return <SettingsTab />;
          default:              return null;
        }
      };

      if (!adminUser) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Caveat', cursive", fontSize: 22, color: 'rgba(62,39,35,0.4)' }}>
          Authenticating…
        </div>
      );

      const sections = [...new Set(TABS.map(t => t.section))];

      return (
        <div className="ad-shell">
          {/* Sidebar */}
          <aside className="ad-sidebar">
            <div className="ad-sidebar-top">
              <div className="ad-logo">Snap<span>Book</span></div>
              <div className="ad-logo-sub">Admin Panel</div>
              <div className="ad-admin-pill">
                <div className="ad-admin-av">{initials(adminUser.name || adminUser.email || 'A')}</div>
                <div>
                  <div className="ad-admin-name">{adminUser.name || 'Admin'}</div>
                  <div className="ad-admin-role">Administrator</div>
                </div>
              </div>
            </div>

            <nav className="ad-nav">
              {sections.map(sec => (
                <div key={sec}>
                  <div className="ad-nav-section">{sec}</div>
                  {TABS.filter(t => t.section === sec).map(tab => (
                    <div
                      key={tab.id}
                      className={`ad-nav-item${activeTab === tab.id ? ' active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="ad-nav-icon">{tab.icon}</span>
                      <span>{tab.label}</span>
                      {tab.id === 'seoqueue' && seoQueueCount > 0 && (
                        <span className="ad-nav-badge" style={{ background: '#7c3aed' }}>{seoQueueCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </nav>

            <div className="ad-sidebar-footer">
              <button className="ad-logout-btn" onClick={logout}>
                <span>↩</span> Sign Out
              </button>
            </div>
          </aside>

          {/* Main */}
          <main className="ad-main">
            <div className="ad-topbar">
              <div className="ad-topbar-title">{TAB_TITLES[activeTab]}</div>
              <div className="ad-topbar-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <div className="ad-content">
              {renderTab()}
            </div>
          </main>
        </div>
      );
    }

export default AdminApp;
