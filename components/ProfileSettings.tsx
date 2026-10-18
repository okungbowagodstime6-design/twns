"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { browserSupabase } from "../lib/supabase/browser";
import { ALL_COUNTRIES, getCountryByCode } from "../lib/constants/countries";
import { ALL_LANGUAGES, getLanguageByCode } from "../lib/constants/languages";
import SearchableOptionPicker, { type SearchableOption } from "./SearchableOptionPicker";
import { categories } from "./MyTwns";

const countryOptions: SearchableOption[] = ALL_COUNTRIES.map((country) => ({ code: country.code, label: country.name, searchText: country.name, icon: country.flag, detail: country.code }));
const languageOptions: SearchableOption[] = ALL_LANGUAGES.map((language) => ({ code: language.code, label: language.name, searchText: `${language.name} ${language.nativeName}`, detail: language.nativeName !== language.name ? language.nativeName : language.code }));

export default function ProfileSettings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("NG");
  const [languageCode, setLanguageCode] = useState("en");
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!browserSupabase) {
      setMessage("Profile settings are unavailable because Supabase is not configured.");
      setReady(true);
      return;
    }

    let active = true;
    async function loadProfile() {
      const { data: { user }, error: userError } = await browserSupabase!.auth.getUser();
      if (!active) return;
      if (userError || !user) {
        setMessage("Sign in to manage your profile.");
        setReady(true);
        return;
      }

      setUserId(user.id);
      const { data: profile, error } = await browserSupabase!.from("profiles").select("display_name, country_code, language_code, preferred_categories").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (error) {
        setMessage(`Your profile could not be loaded: ${error.message}`);
      } else {
        const metadata = user.user_metadata ?? {};
        setFullName(profile?.display_name ?? (typeof metadata.full_name === "string" ? metadata.full_name : ""));
        setCountryCode(profile?.country_code ?? (typeof metadata.country_code === "string" ? metadata.country_code : "NG"));
        setLanguageCode(profile?.language_code ?? (typeof metadata.language_code === "string" ? metadata.language_code : "en"));
        setPreferredCategories(Array.isArray(profile?.preferred_categories) ? profile.preferred_categories : []);
      }
      setReady(true);
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  function toggleCategory(value: string) {
    setPreferredCategories((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    setHasChanges(true);
    setMessage("");
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!browserSupabase || !userId) return;
    setSaving(true);
    setMessage("");
    const normalizedName = fullName.trim();

    const { error: metadataError } = await browserSupabase.auth.updateUser({
      data: { full_name: normalizedName, country_code: countryCode, language_code: languageCode }
    });
    if (metadataError) {
      setMessage(`Your account details could not be updated: ${metadataError.message}`);
      setSaving(false);
      return;
    }

    const { error } = await browserSupabase.from("profiles").upsert({
      id: userId,
      display_name: normalizedName,
      country_code: countryCode,
      language_code: languageCode,
      preferred_categories: preferredCategories
    }, { onConflict: "id" });

    if (error) {
      setMessage(`Your account details were updated, but the profile could not be saved: ${error.message}`);
    } else {
      setHasChanges(false);
      setMessage("Your profile has been saved.");
      window.dispatchEvent(new Event("twns_preferences_changed"));
    }
    setSaving(false);
  }

  if (!ready) return <p className="preference-message" role="status">Loading your profile...</p>;

  return <section className="profile-settings" aria-labelledby="profile-settings-heading">
    <div className="profile-settings-heading">
      <div><p className="section-kicker">PROFILE DETAILS</p><h2 id="profile-settings-heading">Account and reading preferences</h2></div>
      <Link href="/settings" className="text-link">Back to settings</Link>
    </div>
    {userId ? <form className="profile-settings-form" onSubmit={saveProfile}>
      <div className="profile-settings-fields">
        <label className="profile-settings-field">Full name<input autoComplete="name" value={fullName} onChange={(event) => { setFullName(event.target.value); setHasChanges(true); }} required /></label>
        <div className="profile-settings-field"><span>Home country</span><SearchableOptionPicker label="Home country" selectedCode={countryCode} selectedLabel={getCountryByCode(countryCode)?.name ?? countryCode} options={countryOptions} onSelect={(value) => { setCountryCode(value); setHasChanges(true); }} /></div>
        <div className="profile-settings-field"><span>Preferred reading language</span><SearchableOptionPicker label="Preferred reading language" selectedCode={languageCode} selectedLabel={getLanguageByCode(languageCode)?.name ?? languageCode} options={languageOptions} onSelect={(value) => { setLanguageCode(value); setHasChanges(true); }} /></div>
      </div>
      <fieldset className="profile-category-field">
        <legend>Category preferences</legend>
        <p>Select the desks you want prioritized in your TWNS feed.</p>
        <div className="interest-picker">{categories.map((category) => <button key={category.value} type="button" className={`interest-option ${preferredCategories.includes(category.value) ? "is-selected" : ""}`} onClick={() => toggleCategory(category.value)} aria-pressed={preferredCategories.includes(category.value)}>{category.label}</button>)}</div>
      </fieldset>
      <div className="profile-settings-actions"><span>{preferredCategories.length} categories selected</span><button className="button button-dark" type="submit" disabled={!hasChanges || saving}>{saving ? "Saving..." : "Save profile"}</button></div>
    </form> : <p className="preference-message" role="status">{message || "Sign in to manage your profile."}</p>}
    {message && userId && <p className="preference-message" role="status">{message}</p>}
  </section>;
}