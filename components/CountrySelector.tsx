"use client";

import { useEffect, useState } from "react";
import { browserSupabase } from "../lib/supabase/browser";
import SearchableOptionPicker, { type SearchableOption } from "./SearchableOptionPicker";
import { ALL_COUNTRIES, getCountryByCode } from "../lib/constants/countries";

const countryOptions: SearchableOption[] = ALL_COUNTRIES.map((country) => ({
  code: country.code,
  label: country.name,
  searchText: country.name,
  icon: country.flag,
  detail: country.code
}));
const storageKey = "twns_country";

function validCountry(value: string | null | undefined): string | null {
  const normalized = value?.toUpperCase();
  return normalized && getCountryByCode(normalized) ? normalized : null;
}

function readStoredCountry() {
  try {
    return validCountry(window.localStorage.getItem(storageKey)) ?? "NG";
  } catch {
    return "NG";
  }
}

export default function CountrySelector() {
  const [countryCode, setCountryCode] = useState("NG");
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (!browserSupabase) {
      setCountryCode(readStoredCountry());
      setLoading(false);
      return;
    }

    let active = true;

    async function loadCountry(userId?: string) {
      if (!userId) {
        if (active) {
          setCountryCode(readStoredCountry());
          setLoading(false);
        }
        return;
      }

      const { data, error } = await browserSupabase!
        .from("profiles")
        .select("country_code")
        .eq("id", userId)
        .maybeSingle();

      if (!active) return;
      const profileCountry = error ? null : validCountry(data?.country_code);
      const selectedCountry = profileCountry ?? readStoredCountry();
      setCountryCode(selectedCountry);
      setLoading(false);
      try {
        window.localStorage.setItem(storageKey, selectedCountry);
      } catch {
        // The profile value still works when browser storage is unavailable.
      }
    }

    browserSupabase.auth.getSession().then(({ data }) => loadCountry(data.session?.user.id));
    const { data: { subscription } } = browserSupabase.auth.onAuthStateChange((_event, session) => {
      void loadCountry(session?.user.id);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleChange(code: string) {
    const nextCountry = validCountry(code) ?? "NG";
    setCountryCode(nextCountry);
    setSaveMessage("");

    try {
      window.localStorage.setItem(storageKey, nextCountry);
    } catch {
      // Continue with in-memory state if storage is unavailable.
    }
    window.dispatchEvent(new Event("twns_country_changed"));

    if (!browserSupabase) return;
    const { data: { user } } = await browserSupabase.auth.getUser();
    if (!user) return;

    const { data, error } = await browserSupabase
      .from("profiles")
      .update({ country_code: nextCountry })
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      setSaveMessage("Saved on this device; your profile could not be updated.");
    } else if (!data) {
      setSaveMessage("Saved on this device; no profile record was found for this account.");
    } else {
      setSaveMessage("Country preference saved.");
    }
  }

  return (
    <div className="header-reference-selector" title={saveMessage || undefined}>
      <SearchableOptionPicker label="Choose your country" selectedCode={countryCode} selectedLabel={getCountryByCode(countryCode)?.name ?? "Nigeria"} options={countryOptions} onSelect={handleChange} disabled={loading} />
      {saveMessage && <span className="sr-only" role="status">{saveMessage}</span>}
    </div>
  );
}
