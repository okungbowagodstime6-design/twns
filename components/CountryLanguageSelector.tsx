'use client';

import type { CountryCode, LanguageCode } from "@/lib/user-preferences";
import { COUNTRIES, LANGUAGES } from "@/lib/user-preferences";

interface CountryLanguageSelectorProps {
  countryCode: CountryCode;
  languageCode: LanguageCode;
  onCountryChange: (countryCode: CountryCode) => void;
  onLanguageChange: (languageCode: LanguageCode) => void;
}

export default function CountryLanguageSelector({
  countryCode,
  languageCode,
  onCountryChange,
  onLanguageChange
}: CountryLanguageSelectorProps) {
  return (
    <div className="country-language-selector">
      <label>
        Country
        <select value={countryCode} onChange={(event) => onCountryChange(event.target.value as CountryCode)}>
          {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
        </select>
      </label>
      <label>
        Preferred language
        <select value={languageCode} onChange={(event) => onLanguageChange(event.target.value as LanguageCode)}>
          {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.nativeName}</option>)}
        </select>
      </label>
    </div>
  );
}
