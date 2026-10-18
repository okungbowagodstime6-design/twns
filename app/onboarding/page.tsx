"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import CountryLanguageSelector from "@/components/CountryLanguageSelector";
import { browserSupabase } from "@/lib/supabase/browser";
import {
  isCountryCode,
  isLanguageCode,
  type CountryCode,
  type LanguageCode
} from "@/lib/user-preferences";

const INTERESTS = ["Nigeria", "World", "Business", "Technology", "Sports", "Culture"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("NG");
  const [languageCode, setLanguageCode] = useState<LanguageCode>("en");
  const [selected, setSelected] = useState<string[]>(["Nigeria", "World"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPreferences() {
      if (!browserSupabase) {
        if (active) {
          setError("Account services are temporarily unavailable.");
          setLoading(false);
        }
        return;
      }

      const { data: authData, error: authError } = await browserSupabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/sign-in?next=%2Fonboarding");
        return;
      }

      const user = authData.user;
      const { data: profile, error: profileError } = await browserSupabase
        .from("profiles")
        .select("display_name, country_code, language_code, preferred_categories")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setUserId(user.id);
      if (profileError) {
        setError("Could not load your profile. You can still save your preferences.");
      } else {
        const metadata = user.user_metadata as Record<string, unknown>;
        setDisplayName(profile?.display_name ?? (typeof metadata.display_name === "string" ? metadata.display_name : typeof metadata.full_name === "string" ? metadata.full_name : ""));
        setCountryCode(isCountryCode(profile?.country_code) ? profile.country_code : isCountryCode(metadata.country_code) ? metadata.country_code : "NG");
        setLanguageCode(isLanguageCode(profile?.language_code) ? profile.language_code : isLanguageCode(metadata.language_code) ? metadata.language_code : "en");
        if (Array.isArray(profile?.preferred_categories)) {
          setSelected(profile.preferred_categories.filter((item): item is string => typeof item === "string"));
        }
      }
      setLoading(false);
    }

    void loadPreferences();
    return () => { active = false; };
  }, [router]);

  function toggleInterest(interest: string) {
    setSelected((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest]);
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!browserSupabase || !userId) return;

    setSaving(true);
    setSaved(false);
    setError("");
    const { error: saveError } = await browserSupabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim() || null,
      country_code: countryCode,
      language_code: languageCode,
      preferred_categories: selected,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
    setSaving(false);

    if (saveError) {
      setError("Could not save your preferences. Please try again.");
      return;
    }
    setSaved(true);
  }

  return (
    <main>
      <section className="route-hero">
        <p className="section-kicker">PERSONALIZE YOUR SIGNAL</p>
        <h1>Choose what stays close.</h1>
        <p>Build a daily brief around the subjects and places you care about most.</p>
      </section>
      <section className="content-shell preference-content">
        {loading ? <p role="status">Loading your preferences...</p> : !userId ? (
          <div className="admin-message" role="alert">
            {error || "Sign in to save your preferences."} <Link href="/sign-in" className="text-link">Sign in</Link>
          </div>
        ) : (
          <form className="grid gap-6" onSubmit={savePreferences}>
            <CountryLanguageSelector
              countryCode={countryCode}
              languageCode={languageCode}
              onCountryChange={setCountryCode}
              onLanguageChange={setLanguageCode}
            />
            <fieldset>
              <legend className="section-kicker mb-3">YOUR INTERESTS</legend>
              <div className="interest-picker">
                {INTERESTS.map((interest) => (
                  <button
                    aria-pressed={selected.includes(interest)}
                    className={`interest-option ${selected.includes(interest) ? "is-selected" : ""}`}
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    type="button"
                  >
                    {selected.includes(interest) && <Check size={16} aria-hidden="true" />}
                    {interest}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <p className="admin-message" role="alert">{error}</p>}
            <div className="preference-footer">
              <span>{selected.length} interests selected{saved ? " · Saved" : ""}</span>
              <button className="button button-dark" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save preferences"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
