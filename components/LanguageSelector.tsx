"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { browserSupabase } from "../lib/supabase/browser";
import SearchableOptionPicker, { type SearchableOption } from "./SearchableOptionPicker";
import { ALL_LANGUAGES, getLanguageByCode } from "../lib/constants/languages";

const languageOptions: SearchableOption[] = ALL_LANGUAGES.map((language) => ({
  code: language.code,
  label: language.name,
  searchText: `${language.name} ${language.nativeName}`,
  detail: language.nativeName !== language.name ? language.nativeName : language.code
}));
const storageKey = "twns_language";

function validLanguage(value: string | null | undefined): string | null {
  const normalized = value?.toLowerCase();
  return normalized && getLanguageByCode(normalized) ? normalized : null;
}

function readStoredLanguage() {
  try {
    return validLanguage(window.localStorage.getItem(storageKey)) ?? "en";
  } catch {
    return "en";
  }
}

function dispatchLanguageChange() {
  window.dispatchEvent(new Event("twns_language_changed"));
}

export default function LanguageSelector() {
  const [languageCode, setLanguageCode] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!browserSupabase) {
      setLanguageCode(readStoredLanguage());
      setLoading(false);
      return;
    }

    let active = true;

    async function loadLanguage(userId?: string) {
      if (!userId) {
        if (active) {
          const storedLanguage = readStoredLanguage();
          setLanguageCode(storedLanguage);
          setLoading(false);
          dispatchLanguageChange();
        }
        return;
      }

      const { data, error } = await browserSupabase!
        .from("profiles")
        .select("language_code")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;
      const profileLanguage = error ? null : validLanguage(data?.language_code);
      const selectedLanguage = profileLanguage ?? readStoredLanguage();
      setLanguageCode(selectedLanguage);
      setLoading(false);
      try {
        window.localStorage.setItem(storageKey, selectedLanguage);
      } catch {
        // The profile value remains available for this session if storage is disabled.
      }
      dispatchLanguageChange();
    }

    browserSupabase.auth.getSession().then(({ data }) => loadLanguage(data.session?.user.id));
    const { data: { subscription } } = browserSupabase.auth.onAuthStateChange((_event, session) => {
      void loadLanguage(session?.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleChange(code: string) {
    const nextLanguage = validLanguage(code) ?? "en";
    setLanguageCode(nextLanguage);
    setSaveMessage("");

    try {
      window.localStorage.setItem(storageKey, nextLanguage);
    } catch {
      // Keep the selection in component state when localStorage is unavailable.
    }
    dispatchLanguageChange();

    if (!browserSupabase) return;
    const { data: { user } } = await browserSupabase.auth.getUser();
    if (!user) return;

    const { data, error } = await browserSupabase
      .from("profiles")
      .update({ language_code: nextLanguage })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      setSaveMessage("Saved on this device; your profile language could not be updated.");
    } else if (!data) {
      setSaveMessage("Saved on this device; no profile record was found for this account.");
    } else {
      setSaveMessage("Language preference saved.");
    }
  }

  return (
    <div className="header-reference-selector" title={saveMessage || undefined}>
      <SearchableOptionPicker label="Choose your language" selectedCode={languageCode} selectedLabel={getLanguageByCode(languageCode)?.name ?? "English"} options={languageOptions} onSelect={handleChange} disabled={loading} />
      {saveMessage && <span className="sr-only" role="status">{saveMessage}</span>}
    </div>
  );
}
