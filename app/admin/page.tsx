"use client";

import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, LogOut, Play, RefreshCw, ShieldAlert, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import TWNSHeader from "../../components/TWNSHeader";
import { browserSupabase } from "../../lib/supabase/browser";

type CategoryInfo = { name: string; slug: string } | null;

type Source = {
  id: string;
  name: string;
  source_type: string;
  endpoint: string;
  country_code: string | null;
  health_status: string;
  last_success_at: string | null;
  last_error_at: string | null;
  total_successes: number;
  total_failures: number;
  categories?: CategoryInfo;
};

type Article = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  country_code: string | null;
  article_type: string | null;
  source_name: string | null;
  editorial_flags: { severity: string; reason: string }[];
};

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
  const [runningIngestion, setRunningIngestion] = useState(false);
  const [filterHealth, setFilterHealth] = useState<"ALL" | "HEALTHY" | "ATTENTION">("ALL");

  useEffect(() => {
    if (!browserSupabase) return;
    browserSupabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const subscription = browserSupabase.auth.onAuthStateChange((_event, session) =>
      setToken(session?.access_token ?? null)
    );
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (token) void loadDashboard();
  }, [token]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!browserSupabase) return setMessage("Supabase configuration is missing.");
    const { error } = await browserSupabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  async function loadDashboard() {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [sourceResponse, reviewResponse] = await Promise.all([
        fetch("/api/admin/sources", { headers }),
        fetch("/api/admin/review", { headers })
      ]);
      const sourceData = await sourceResponse.json();
      const reviewData = await reviewResponse.json();
      setSources(sourceData.sources ?? []);
      setArticles(reviewData.articles ?? []);
      if (!sourceResponse.ok || !reviewResponse.ok) {
        setMessage(sourceData.error || reviewData.error || "Unable to load newsroom data.");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error loading newsroom.");
    }
  }

  async function runDueIngestion() {
    if (!token) return;
    setRunningIngestion(true);
    setMessage("Running automated ingestion across due sources...");
    try {
      const res = await fetch("/api/admin/ingestion/run-due", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessage(res.ok ? `Ingestion complete: ${data.processed ?? 0} sources processed.` : data.error);
      if (res.ok) void loadDashboard();
    } catch (err) {
      setMessage(`Run failed: ${err instanceof Error ? err.message : "Error"}`);
    } finally {
      setRunningIngestion(false);
    }
  }

  async function runSource(source: Source, method: "POST" | "PUT") {
    if (!token) return;
    setMessage(`${method === "PUT" ? "Running" : "Testing"} ${source.name}...`);
    const response = await fetch(`/api/admin/sources/${source.id}`, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? method === "PUT"
          ? `${source.name}: ${data.created} new, ${data.skipped} skipped.`
          : `${source.name}: ${data.itemsDiscovered} items discovered.`
        : data.error
    );
    if (method === "PUT" && response.ok) void loadDashboard();
  }

  async function addSource(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setMessage("Your session is missing. Sign out and sign in again.");
      return;
    }
    setSubmittingSource(true);
    try {
      const response = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sourceName.trim(),
          source_type: sourceType,
          endpoint: sourceEndpoint.trim()
        })
      });
      const data = await response.json().catch(() => ({}));
      setMessage(
        response.ok
          ? `${sourceName} added.`
          : `Add source failed (${response.status}): ${data.error || "Unknown server error."}`
      );
      if (response.ok) {
        setSourceName("");
        setSourceEndpoint("");
        void loadDashboard();
      }
    } catch (error) {
      setMessage(`Add source failed: ${error instanceof Error ? error.message : "Network error."}`);
    } finally {
      setSubmittingSource(false);
    }
  }

  async function reviewArticle(id: string, action: "approve" | "reject") {
    if (!token) return;
    const response = await fetch(`/api/admin/articles/${id}/${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: action === "reject" ? JSON.stringify({}) : undefined
    });
    const data = await response.json();
    setMessage(response.ok ? `Article ${action}d.` : data.error);
    if (response.ok) void loadDashboard();
  }

  const healthyCount = sources.filter((s) => s.health_status === "HEALTHY").length;
  const attentionCount = sources.filter((s) => s.health_status !== "HEALTHY").length;

  const filteredSources = sources.filter((s) => {
    if (filterHealth === "HEALTHY") return s.health_status === "HEALTHY";
    if (filterHealth === "ATTENTION") return s.health_status !== "HEALTHY";
    return true;
  });

  return (
    <main>
      <TWNSHeader />
      <section className="route-hero">
        <p className="section-kicker">TWNS NEWSROOM OPERATIONS</p>
        <h1>24/7 Global News Engine</h1>
        <p>Monitor source health, review cross-verified clusters, and manage editorial publishing.</p>
      </section>

      <section className="content-shell admin-shell">
        <Link href="/" className="text-link">
          <ArrowLeft size={16} /> Back to the front page
        </Link>

        {!token ? (
          <form className="admin-login" onSubmit={login}>
            <ShieldAlert size={28} />
            <h2>Editorial Sign-In</h2>
            <p>Authorized TWNS editors only.</p>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button className="button button-dark" type="submit">
              <LoaderCircle size={16} /> Sign in
            </button>
            {message && <p className="admin-message">{message}</p>}
          </form>
        ) : (
          <>
            {/* Top Toolbar */}
            <div className="admin-toolbar">
              <div>
                <p className="section-kicker">CONTROL ROOM</p>
                <h2>Newsroom Pulse</h2>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className="button button-dark"
                  type="button"
                  onClick={runDueIngestion}
                  disabled={runningIngestion}
                >
                  <RefreshCw size={14} className={runningIngestion ? "spinning" : ""} />
                  {runningIngestion ? "Processing..." : "Trigger Due Ingestion"}
                </button>
                <button
                  className="button button-outline-dark"
                  type="button"
                  onClick={() => browserSupabase?.auth.signOut()}
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>

            {message && <p className="admin-message">{message}</p>}

            {/* Quick Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "24px" }}>
              <div style={{ background: "#fff", padding: "18px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--muted)" }}>SOURCES MONITORED</span>
                <h3 style={{ fontSize: "28px", margin: "8px 0 0", fontFamily: "Space Grotesk" }}>{sources.length}</h3>
              </div>
              <div style={{ background: "#fff", padding: "18px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--muted)" }}>HEALTHY FEEDS</span>
                <h3 style={{ fontSize: "28px", margin: "8px 0 0", color: "#16a34a", fontFamily: "Space Grotesk" }}>{healthyCount}</h3>
              </div>
              <div style={{ background: "#fff", padding: "18px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--muted)" }}>ATTENTION NEEDED</span>
                <h3 style={{ fontSize: "28px", margin: "8px 0 0", color: attentionCount ? "#dc2626" : "var(--muted)", fontFamily: "Space Grotesk" }}>{attentionCount}</h3>
              </div>
              <div style={{ background: "#fff", padding: "18px", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--muted)" }}>AWAITING EDITORIAL REVIEW</span>
                <h3 style={{ fontSize: "28px", margin: "8px 0 0", color: "var(--blue)", fontFamily: "Space Grotesk" }}>{articles.length}</h3>
              </div>
            </div>

            {/* Source Health Board (Requirement 16) */}
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Source Health Board</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>Live status of global wire feeds and category endpoints</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className={`button ${filterHealth === "ALL" ? "button-dark" : "button-outline-dark"}`}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => setFilterHealth("ALL")}
                  >
                    All ({sources.length})
                  </button>
                  <button
                    className={`button ${filterHealth === "HEALTHY" ? "button-dark" : "button-outline-dark"}`}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => setFilterHealth("HEALTHY")}
                  >
                    Healthy ({healthyCount})
                  </button>
                  <button
                    className={`button ${filterHealth === "ATTENTION" ? "button-dark" : "button-outline-dark"}`}
                    style={{ padding: "6px 12px", fontSize: "12px" }}
                    onClick={() => setFilterHealth("ATTENTION")}
                  >
                    Attention ({attentionCount})
                  </button>
                </div>
              </div>

              <div className="admin-table">
                {filteredSources.length ? (
                  filteredSources.map((source) => (
                    <div className="admin-row" key={source.id}>
                      <div style={{ flex: "1 1 300px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong>{source.name}</strong>
                          {source.country_code && (
                            <span style={{ fontSize: "10px", padding: "2px 6px", background: "#f4f4f5", borderRadius: "3px", fontFamily: "DM Mono" }}>
                              {source.country_code}
                            </span>
                          )}
                          {source.categories?.name && (
                            <span style={{ fontSize: "10px", padding: "2px 6px", background: "#eff6ff", color: "var(--blue)", borderRadius: "3px", fontFamily: "DM Mono" }}>
                              {source.categories.name}
                            </span>
                          )}
                        </div>
                        <small>{source.source_type} · {source.endpoint}</small>
                      </div>

                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--muted)", textAlign: "right" }}>
                          <div>Success: {source.total_successes || 0} / Fail: {source.total_failures || 0}</div>
                          {source.last_success_at && (
                            <div>Last: {new Date(source.last_success_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                          )}
                        </div>
                        <span className={`health health-${source.health_status.toLowerCase()}`}>
                          {source.health_status}
                        </span>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Test ${source.name}`}
                          title="Test feed connectivity"
                          onClick={() => runSource(source, "POST")}
                        >
                          <Play size={14} />
                        </button>
                        <button
                          className="icon-button"
                          type="button"
                          aria-label={`Run ${source.name}`}
                          title="Trigger ingestion"
                          onClick={() => runSource(source, "PUT")}
                        >
                          <Check size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No sources matched the selected filter.</p>
                )}
              </div>
            </section>

            {/* Add Source Form */}
            <form className="source-form" onSubmit={addSource} style={{ marginTop: "32px" }}>
              <h2>Register New News Source</h2>
              <label>
                Name
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. France 24 English"
                  required
                />
              </label>
              <label>
                Type
                <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
                  <option>RSS</option>
                  <option>API</option>
                  <option>OFFICIAL</option>
                  <option>PUBLISHER</option>
                </select>
              </label>
              <label>
                Endpoint URL
                <input
                  type="url"
                  value={sourceEndpoint}
                  onChange={(e) => setSourceEndpoint(e.target.value)}
                  placeholder="https://example.org/feed.xml"
                  required
                />
              </label>
              <button className="button button-dark" type="submit" disabled={submittingSource}>
                {submittingSource ? "Registering..." : "Add Source"}
              </button>
            </form>

            {/* Editorial Review Cockpit (Requirement 17) */}
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>Editorial Review Desk</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                    Synthesized articles awaiting publication approval
                  </p>
                </div>
                <span>{articles.length} stories</span>
              </div>
              <div className="review-list">
                {articles.length ? (
                  articles.map((article) => (
                    <article className="review-item" key={article.id}>
                      <div style={{ flex: "1 1 auto" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                          <span className="story-category">{article.article_type || "STANDARD"}</span>
                          {article.country_code && (
                            <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--muted)" }}>
                              📍 {article.country_code}
                            </span>
                          )}
                          {article.source_name && (
                            <span style={{ fontSize: "11px", fontFamily: "DM Mono", color: "var(--muted)" }}>
                              Source: {article.source_name}
                            </span>
                          )}
                        </div>
                        <h3 style={{ margin: "0 0 6px" }}>{article.title}</h3>
                        <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: "13px", lineHeight: "1.5" }}>
                          {article.summary || "No summary available."}
                        </p>
                        {article.editorial_flags?.map((flag) => (
                          <small className="risk-flag" key={flag.reason}>
                            ⚠️ {flag.severity}: {flag.reason}
                          </small>
                        ))}
                      </div>
                      <div className="review-actions">
                        <button
                          className="icon-button approve"
                          type="button"
                          aria-label="Approve article"
                          title="Approve & Publish to Front Page"
                          onClick={() => reviewArticle(article.id, "approve")}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          className="icon-button reject"
                          type="button"
                          aria-label="Reject article"
                          title="Reject article"
                          onClick={() => reviewArticle(article.id, "reject")}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">No articles are currently awaiting editorial review.</p>
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}