"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, LoaderCircle, LockKeyhole, Save } from "lucide-react";
import { browserSupabase } from "../lib/supabase/browser";

type Category = { label: string; value: string };
type Story = { id: string; slug: string; title: string; summary: string | null; category: string | null; country_code: string | null; language_code: string | null; published_at: string | null };

export const categories: Category[] = [
  { label: "World", value: "world" }, { label: "Business", value: "business" }, { label: "Technology", value: "technology" },
  { label: "Sports", value: "sports" }, { label: "Entertainment", value: "entertainment" }, { label: "Politics", value: "politics" },
  { label: "Finance", value: "finance" }, { label: "Security", value: "security" }, { label: "Science", value: "science" },
  { label: "Health", value: "health" }, { label: "Education", value: "education" }, { label: "Agriculture", value: "agriculture" },
  { label: "Environment", value: "environment" }, { label: "Automotive", value: "automotive" }
];
const articleFields = "id, slug, title, summary, category, country_code, language_code, published_at";

function storedPreference(key: string, fallback: string) {
  try { return window.localStorage.getItem(key) || fallback; } catch { return fallback; }
}

function categoryValues(values: string[]) {
  return Array.from(new Set(values.flatMap((value) => value === "technology" ? ["TECHNOLOGY", "TECH"] : [value.toUpperCase()])));
}

function formatDate(value: string | null) {
  if (!value) return "Recently published";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently published" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function CategoryPreferences() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState("NG");
  const [languageCode, setLanguageCode] = useState("en");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!browserSupabase) { setReady(true); return; }
    let active = true;
    browserSupabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserId(data.session?.user.id ?? null);
      if (!data.session) setReady(true);
    });
    const { data: { subscription } } = browserSupabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserId(session?.user.id ?? null);
      if (!session) setReady(true);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!userId || !browserSupabase) return;
    let active = true;
    async function loadPreferences() {
      setReady(false);
      const { data, error } = await browserSupabase!.from("profiles").select("preferred_categories, country_code, language_code").eq("id", userId!).maybeSingle();
      if (!active) return;
      if (error) setMessage("Apply the TWNS personalization migration before saving interests.");
      else {
        setSelected(Array.isArray(data?.preferred_categories) ? data.preferred_categories : []);
        setCountryCode(data?.country_code || storedPreference("twns_country", "NG").toUpperCase());
        setLanguageCode(data?.language_code || storedPreference("twns_language", "en").toLowerCase());
        setMessage("");
      }
      setReady(true);
    }
    void loadPreferences();
    return () => { active = false; };
  }, [userId]);

  function toggle(value: string) {
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    setHasChanges(true);
    setMessage("");
  }

  async function savePreferences() {
    if (!browserSupabase || !userId) return;
    setSaving(true);
    setMessage("");
    try {
      const { error } = await browserSupabase.from("profiles").upsert({
        id: userId,
        country_code: countryCode || storedPreference("twns_country", "NG").toUpperCase(),
        language_code: languageCode || storedPreference("twns_language", "en").toLowerCase(),
        preferred_categories: selected
      }, { onConflict: "id" });
      if (error) throw error;
      setHasChanges(false);
      setMessage("Your interests are saved to your profile.");
      window.dispatchEvent(new Event("twns_preferences_changed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your interests could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <p className="preference-message">Loading profile preferences...</p>;
  if (!userId) return <div className="my-twns-guest"><LockKeyhole size={22} /><div><h2>Sign in to save your signal</h2><p>Your preferred desks and edition follow your profile across devices.</p></div><Link className="button button-dark" href="/sign-in">Sign in</Link><Link className="my-twns-signup" href="/sign-up">Create account <ArrowUpRight size={14} /></Link></div>;

  return <section className="my-twns-preferences" aria-labelledby="interest-heading">
    <div className="my-twns-preferences-heading"><div><p className="section-kicker">YOUR PROFILE</p><h2 id="interest-heading">Choose your desks</h2><p>Stories from {countryCode} in {languageCode.toUpperCase()}, prioritized by your selected coverage.</p></div><button className="button button-dark" type="button" onClick={savePreferences} disabled={!hasChanges || saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />} Save interests</button></div>
    <div className="interest-picker">{categories.map((item) => <button type="button" className={`interest-option ${selected.includes(item.value) ? "is-selected" : ""}`} onClick={() => toggle(item.value)} key={item.value} aria-pressed={selected.includes(item.value)}>{selected.includes(item.value) && <Check size={16} />} {item.label}</button>)}</div>
    {message && <p className="preference-message" role="status">{message}</p>}
    <div className="preference-footer"><span>{selected.length} selected</span><Link href="/settings" className="text-link">Profile settings</Link></div>
  </section>;
}

export default function MyTwnsFeed() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState("NG");
  const [languageCode, setLanguageCode] = useState("en");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!browserSupabase) { setAuthReady(true); return; }
    browserSupabase.auth.getSession().then(({ data }) => { setUserId(data.session?.user.id ?? null); setAuthReady(true); });
    const { data: { subscription } } = browserSupabase.auth.onAuthStateChange((_event, session) => { setUserId(session?.user.id ?? null); setAuthReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId || !browserSupabase) { setProfileReady(true); return; }
    let active = true;
    async function loadProfile() {
      setProfileReady(false);
      const { data, error } = await browserSupabase!.from("profiles").select("preferred_categories, country_code, language_code").eq("id", userId!).maybeSingle();
      if (!active) return;
      if (error) {
        setMessage("Apply the TWNS personalization migration to enable your saved feed.");
      } else {
        setPreferences(Array.isArray(data?.preferred_categories) ? data.preferred_categories : []);
        setCountryCode(data?.country_code || storedPreference("twns_country", "NG").toUpperCase());
        setLanguageCode(data?.language_code || storedPreference("twns_language", "en").toLowerCase());
        setMessage("");
      }
      setProfileReady(true);
    }
    void loadProfile();
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    const updateEdition = () => {
      setCountryCode(storedPreference("twns_country", "NG").toUpperCase());
      setLanguageCode(storedPreference("twns_language", "en").toLowerCase());
    };
    window.addEventListener("twns_country_changed", updateEdition);
    window.addEventListener("twns_language_changed", updateEdition);
    return () => {
      window.removeEventListener("twns_country_changed", updateEdition);
      window.removeEventListener("twns_language_changed", updateEdition);
    };
  }, []);

  useEffect(() => {
    if (!userId || !browserSupabase) return;
    const refreshPreferences = async () => {
      const { data, error } = await browserSupabase!.from("profiles").select("preferred_categories, country_code, language_code").eq("id", userId).maybeSingle();
      if (error || !data) return;
      setPreferences(Array.isArray(data.preferred_categories) ? data.preferred_categories : []);
      setCountryCode(data.country_code || storedPreference("twns_country", "NG").toUpperCase());
      setLanguageCode(data.language_code || storedPreference("twns_language", "en").toLowerCase());
    };
    window.addEventListener("twns_preferences_changed", refreshPreferences);
    return () => window.removeEventListener("twns_preferences_changed", refreshPreferences);
  }, [userId]);

  useEffect(() => {
    if (!userId || !profileReady || !browserSupabase) { setStories([]); return; }
    let active = true;
    async function loadFeed() {
      setLoading(true);
      const requests = [];
      let editionQuery = browserSupabase!.from("news_articles").select(articleFields).eq("status", "PUBLISHED").order("published_at", { ascending: false }).limit(30);
      if (countryCode) editionQuery = editionQuery.eq("country_code", countryCode);
      if (languageCode) editionQuery = editionQuery.eq("language_code", languageCode);
      requests.push(editionQuery);
      if (preferences.length) {
        requests.push(browserSupabase!.from("news_articles").select(articleFields).eq("status", "PUBLISHED").in("category", categoryValues(preferences)).order("published_at", { ascending: false }).limit(40));
      }
      const results = await Promise.all(requests);
      if (!active) return;
      const merged = new Map<string, Story>();
      results.forEach((result) => ((result.data ?? []) as Story[]).forEach((story) => merged.set(story.id, story)));
      const preferenceSet = new Set(preferences);
      const mergedStories: Story[] = [];
      merged.forEach((story) => mergedStories.push(story));
      const ranked = mergedStories.map((story) => {
        const categoryMatch = story.category ? preferenceSet.has(story.category.toLowerCase()) || story.category.toLowerCase() === "tech" && preferenceSet.has("technology") : false;
        const countryMatch = Boolean(countryCode && story.country_code?.toUpperCase() === countryCode.toUpperCase());
        const languageMatch = Boolean(languageCode && story.language_code?.toLowerCase() === languageCode.toLowerCase());
        return { story, score: Number(categoryMatch) * 4 + Number(countryMatch) * 3 + Number(languageMatch) * 2 };
      }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score || Date.parse(right.story.published_at ?? "") - Date.parse(left.story.published_at ?? "")).slice(0, 30).map(({ story }) => story);
      setStories(ranked);
      setLoading(false);
    }
    void loadFeed();
    return () => { active = false; };
  }, [userId, profileReady, preferences, countryCode, languageCode]);

  if (!authReady) return <p className="broadcast-empty">Loading your station...</p>;
  if (!userId) return <div className="my-twns-guest my-twns-guest-large"><LockKeyhole size={26} /><div><h2>Your own world desk.</h2><p>Sign in to shape a station around your country, language, and chosen coverage.</p></div><Link className="button button-dark" href="/sign-in">Sign in to My TWNS</Link><Link className="my-twns-signup" href="/sign-up">Create an account <ArrowUpRight size={14} /></Link></div>;

  return <div className="my-twns-dashboard">
    <CategoryPreferences />
    <section className="my-twns-feed-section"><div className="broadcast-section-heading"><div><p className="broadcast-eyebrow">YOUR EDITION · {countryCode} · {languageCode.toUpperCase()}</p><h2>Picked for you</h2></div><span>{preferences.length} desks followed</span></div>
      {message && <p className="studio-feedback" role="status">{message}</p>}
      {loading || !profileReady ? <p className="broadcast-empty">Building your station feed...</p> : stories.length ? <div className="my-twns-story-list">{stories.map((story) => (
        <Link className="my-twns-story" href={`/article/${story.slug}`} key={story.id}>
          <div className="my-twns-story-copy">
            <div><span className="story-category">{story.category || "WORLD"}</span><span className="my-twns-location">{story.country_code || "Global"}</span></div>
            <h3>{story.title}</h3>
            <p>{story.summary || "Read the attributed report from the TWNS newsroom."}</p>
            <small>{formatDate(story.published_at)} · {story.language_code?.toUpperCase() || "EN"}</small>
          </div>
          <ArrowUpRight className="my-twns-story-arrow" size={17} />
        </Link>
      ))}</div> : <p className="broadcast-empty">No published stories match your current edition and followed desks yet. Add more interests or update your country and language above.</p>}
    </section>
  </div>;
}
