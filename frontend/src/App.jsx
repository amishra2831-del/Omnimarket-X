import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const statusLabel = { needs_review: 'Needs review', approved: 'Approved', rejected: 'Rejected', created: 'Created', discovered: 'Discovered' };

function Badge({ children, tone = 'neutral' }) { return <span className={`badge ${tone}`}>{children}</span>; }

function App() {
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({ total: 0, review: 0, approved: 0, created: 0, rejected: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selected = useMemo(() => candidates.find(c => c._id === selectedId), [candidates, selectedId]);
  const visible = filter === 'all' ? candidates : candidates.filter(c => c.status === filter);

  async function refresh() {
    const [items, s] = await Promise.all([request('/candidates'), request('/candidates/stats')]);
    setCandidates(items); setStats(s);
    if (!selectedId && items[0]) setSelectedId(items[0]._id);
  }

  useEffect(() => { refresh().catch(e => setError(e.message)); }, []);

  async function discover() {
    setLoading(true); setError(''); setMessage('');
    try { const result = await request('/discovery', { method: 'POST' }); await refresh(); if (result.candidates[0]) setSelectedId(result.candidates[0]._id); setMessage(`Discovery complete: ${result.count} candidate(s) available. ${result.sourceStatus}`); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function review(action) {
    if (!selected) return;
    setLoading(true); setError('');
    try { await request(`/candidates/${selected._id}/review`, { method: 'POST', body: JSON.stringify({ action, note: action === 'approve' ? 'Reviewed and approved by internal reviewer.' : 'Rejected during review.' }) }); await refresh(); setMessage(`Candidate ${action}d.`); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function createMarket() {
    setLoading(true); setError('');
    try { const market = await request(`/markets/from-candidate/${selected._id}`, { method: 'POST' }); await refresh(); setMessage(`Market created: ${market.marketId}`); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  async function saveEdit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { question: form.get('question'), category: form.get('category'), description: form.get('description'), eventDate: form.get('eventDate'), closingDate: form.get('closingDate'), resolutionCriteria: form.get('resolutionCriteria'), resolutionSource: form.get('resolutionSource') };
    setLoading(true); setError('');
    try { const updated = await request(`/candidates/${selected._id}`, { method: 'PATCH', body: JSON.stringify(body) }); setCandidates(candidates.map(c => c._id === updated._id ? updated : c)); setMessage('Candidate saved and revalidated.'); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <div><div className="brand"><span className="brand-mark">OMX</span> OmniMarketX</div><div className="subtitle">Market Discovery & Creation System</div></div>
      <button className="primary" onClick={discover} disabled={loading}>{loading ? 'Working…' : 'Run Discovery'}</button>
    </header>

    <section className="pipeline">
      {['Discover','Analyze','Structure','Validate','Review','Create'].map((step, i) => <div className="pipeline-step" key={step}><span>{i + 1}</span>{step}{i < 5 && <b>→</b>}</div>)}
    </section>

    {message && <div className="toast success">✓ {message}</div>}
    {error && <div className="toast error">⚠ {error}</div>}

    <main className="content">
      <section className="stats">
        <Stat label="Candidates" value={stats.total}/><Stat label="Needs review" value={stats.review}/><Stat label="Approved" value={stats.approved}/><Stat label="Created" value={stats.created}/><Stat label="Rejected" value={stats.rejected}/>
      </section>

      <div className="workspace">
        <aside className="queue card">
          <div className="card-header"><div><h2>Review Queue</h2><p>Generated opportunities</p></div><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All</option><option value="needs_review">Needs review</option><option value="approved">Approved</option><option value="created">Created</option><option value="rejected">Rejected</option></select></div>
          <div className="candidate-list">{visible.length === 0 ? <div className="empty">No candidates yet. Run discovery to load the demo workflow.</div> : visible.map(c => <button className={`candidate-row ${selectedId === c._id ? 'active' : ''}`} key={c._id} onClick={() => setSelectedId(c._id)}><div className="row-top"><Badge tone={c.status}>{statusLabel[c.status]}</Badge><span className="confidence">{c.confidence}%</span></div><strong>{c.question}</strong><small>{c.category} · {new Date(c.createdAt).toLocaleDateString()}</small></button>)}</div>
        </aside>

        <section className="detail card">{selected ? <>
          <div className="detail-head"><div><Badge tone={selected.status}>{statusLabel[selected.status]}</Badge><h1>Candidate Review</h1><p>Inspect, edit, validate and approve this opportunity.</p></div><div className="score"><strong>{selected.confidence}</strong><span>quality score</span></div></div>
          <form onSubmit={saveEdit}>
            <div className="grid2"><Field label="Market question"><input name="question" defaultValue={selected.question}/></Field><Field label="Category"><input name="category" defaultValue={selected.category}/></Field></div>
            <Field label="Description"><textarea name="description" rows="3" defaultValue={selected.description}/></Field>
            <div className="grid2"><Field label="Event date"><input type="datetime-local" name="eventDate" defaultValue={toLocalInput(selected.eventDate)}/></Field><Field label="Closing date"><input type="datetime-local" name="closingDate" defaultValue={toLocalInput(selected.closingDate)}/></Field></div>
            <Field label="Resolution criteria"><textarea name="resolutionCriteria" rows="4" defaultValue={selected.resolutionCriteria}/></Field>
            <Field label="Resolution source"><input name="resolutionSource" defaultValue={selected.resolutionSource}/></Field>
            <div className="actions"><button className="secondary" disabled={loading}>Save & Revalidate</button>{selected.status === 'needs_review' && <><button type="button" className="danger" onClick={() => review('reject')} disabled={loading}>Reject</button><button type="button" className="primary" onClick={() => review('approve')} disabled={loading}>Approve</button></>}{selected.status === 'approved' && <button type="button" className="primary" onClick={createMarket} disabled={loading}>Create Market</button>}</div>
          </form>

          <div className="section"><h3>Validation</h3><div className="validation-list">{selected.validationIssues?.length ? selected.validationIssues.map((issue, i) => <div className={`issue ${issue.severity}`} key={i}><span>{issue.severity === 'error' ? '!' : issue.severity === 'warning' ? '△' : 'i'}</span><div><strong>{issue.code}</strong><p>{issue.message}</p></div></div>) : <div className="clean">✓ No validation issues found.</div>}</div></div>

          <div className="section"><h3>Supporting sources</h3>{selected.sourceLinks?.map(s => <a className="source" key={s._id} href={s.url} target="_blank" rel="noreferrer"><span>↗</span><div><strong>{s.title}</strong><small>{s.publisher} · {s.sourceType}</small></div></a>)}</div>
          {selected.createdMarket && <div className="created-box"><span>MARKET CREATED</span><strong>{selected.createdMarket.marketId}</strong><p>{selected.createdMarket.question}</p></div>}
        </> : <div className="empty detail-empty">Select a candidate from the queue.</div>}</section>
      </div>
    </main>
    <footer>Human review required before market creation · Demo environment · OmniMarketX assignment</footer>
  </div>
}

function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{value}</strong></div> }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label> }
function toLocalInput(value) { if (!value) return ''; const d = new Date(value); const pad = n => String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }

export default App;
