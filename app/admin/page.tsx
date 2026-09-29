"use client";

import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, LogOut, Play, ShieldAlert, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import TWNSHeader from "../../components/TWNSHeader";
import { browserSupabase } from "../../lib/supabase/browser";

type Source = { id: string; name: string; source_type: string; endpoint: string; health_status: string };
type Article = { id: string; title: string; summary: string | null; status: string; editorial_flags: { severity: string; reason: string }[] };

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState("RSS");
  const [sourceEndpoint, setSourceEndpoint] = useState("");
  const [submittingSource, setSubmittingSource] = useState(false);

  useEffect(() => {
    if (!browserSupabase) return;
    browserSupabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const subscription = browserSupabase.auth.onAuthStateChange((_event, session) => setToken(session?.access_token ?? null));
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (token) void loadDashboard(); }, [token]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!browserSupabase) return setMessage("Supabase public configuration is missing.");
    const { error } = await browserSupabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  async function loadDashboard() {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const [sourceResponse, reviewResponse] = await Promise.all([fetch("/api/admin/sources", { headers }), fetch("/api/admin/review", { headers })]);
    const sourceData = await sourceResponse.json();
    const reviewData = await reviewResponse.json();
    setSources(sourceData.sources ?? []);
    setArticles(reviewData.articles ?? []);
    if (!sourceResponse.ok || !reviewResponse.ok) setMessage(sourceData.error || reviewData.error || "Unable to load newsroom data.");
  }

  async function runSource(source: Source, method: "POST" | "PUT") {
    if (!token) return;
    setMessage(`${method === "PUT" ? "Running" : "Testing"} ${source.name}...`);
    const response = await fetch(`/api/admin/sources/${source.id}`, { method, headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    setMessage(response.ok ? (method === "PUT" ? `${source.name}: ${data.created} new, ${data.skipped} skipped.` : `${source.name}: ${data.itemsDiscovered} items discovered.`) : data.error);
    if (method === "PUT" && response.ok) void loadDashboard();
  }

  async function processSource(source: Source) {
    if (!token) return;
    setMessage(`Processing ${source.name} items...`);
    const response = await fetch(`/api/admin/sources/${source.id}/process`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    setMessage(response.ok ? `${source.name}: ${data.created} articles moved to review.` : data.error);
    if (response.ok) void loadDashboard();
  }

  async function addSource(event: FormEvent) {
    event.preventDefault();
    if (!token) { setMessage("Your session is missing. Sign out and sign in again."); return; }
    setSubmittingSource(true);
    try {
      const response = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: sourceName.trim(), source_type: sourceType, endpoint: sourceEndpoint.trim() })
      });
      const data = await response.json().catch(() => ({}));
      setMessage(response.ok ? `${sourceName} added.` : `Add source failed (${response.status}): ${data.error || "Unknown server error."}`);
      if (response.ok) { setSourceName(""); setSourceEndpoint(""); void loadDashboard(); }
    } catch (error) {
      setMessage(`Add source failed: ${error instanceof Error ? error.message : "Network error."}`);
    } finally {
      setSubmittingSource(false);
    }
  }

  async function reviewArticle(id: string, action: "approve" | "reject") {
    if (!token) return;
    const response = await fetch(`/api/admin/articles/${id}/${action}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: action === "reject" ? JSON.stringify({}) : undefined });
    const data = await response.json();
    setMessage(response.ok ? `Article ${action}d.` : data.error);
    if (response.ok) void loadDashboard();
  }

  return <main>
    <TWNSHeader />
    <section className="route-hero"><p className="section-kicker">TWNS NEWSROOM</p><h1>Editorial control center</h1><p>Monitor trusted sources, inspect incoming reports, and keep publication decisions human-led.</p></section>
    <section className="content-shell admin-shell">
      <Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link>
      {!token ? <form className="admin-login" onSubmit={login}><ShieldAlert size={28} /><h2>Editorial sign-in</h2><p>Only authorized TWNS editorial users can access newsroom controls.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button-dark" type="submit"><LoaderCircle size={16} /> Sign in</button>{message && <p className="admin-message">{message}</p>}</form> : <>
        <div className="admin-toolbar"><div><p className="section-kicker">OVERVIEW</p><h2>Newsroom pulse</h2></div><button className="button button-outline-dark" type="button" onClick={() => browserSupabase?.auth.signOut()}><LogOut size={16} /> Sign out</button></div>
        {message && <p className="admin-message">{message}</p>}
        <form className="source-form" onSubmit={addSource}><h2>Add source</h2><label>Name<input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Example News Desk" required /></label><label>Type<select value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option>RSS</option><option>API</option><option>OFFICIAL</option><option>PUBLISHER</option></select></label><label>Endpoint<input type="url" value={sourceEndpoint} onChange={(event) => setSourceEndpoint(event.target.value)} placeholder="https://example.org/feed.xml" required /></label><button className="button button-dark" type="submit" disabled={submittingSource}>{submittingSource ? "Adding..." : "Add source"}</button></form>
        <section className="admin-section"><div className="admin-section-heading"><h2>Source health</h2><span>{sources.length} configured</span></div><div className="admin-table">{sources.length ? sources.map((source) => <div className="admin-row" key={source.id}><div><strong>{source.name}</strong><small>{source.source_type} · {source.endpoint}</small></div><span className={`health health-${source.health_status.toLowerCase()}`}>{source.health_status}</span><button className="icon-button" type="button" aria-label={`Test ${source.name}`} onClick={() => runSource(source, "POST")}><Play size={15} /></button><button className="icon-button" type="button" aria-label={`Run ${source.name}`} onClick={() => runSource(source, "PUT")}><Check size={15} /></button><button className="icon-button" type="button" aria-label={`Process ${source.name}`} onClick={() => processSource(source)}><LoaderCircle size={15} /></button></div>) : <p className="empty-state">No sources configured yet.</p>}</div></section>
        <section className="admin-section"><div className="admin-section-heading"><h2>Editorial review</h2><span>{articles.length} awaiting attention</span></div><div className="review-list">{articles.length ? articles.map((article) => <article className="review-item" key={article.id}><div><span className="story-category">{article.status}</span><h3>{article.title}</h3><p>{article.summary || "No summary available."}</p>{article.editorial_flags?.map((flag) => <small className="risk-flag" key={flag.reason}>{flag.severity}: {flag.reason}</small>)}</div><div className="review-actions"><button className="icon-button approve" type="button" aria-label="Approve article" onClick={() => reviewArticle(article.id, "approve")}><Check size={16} /></button><button className="icon-button reject" type="button" aria-label="Reject article" onClick={() => reviewArticle(article.id, "reject")}><X size={16} /></button></div></article>) : <p className="empty-state">No articles are awaiting editorial review.</p>}</div></section>
      </>}
    </section>
  </main>;
}