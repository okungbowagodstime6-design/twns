'use client';

import React, { useEffect, useState } from 'react';

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
];

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export default function CountryLanguageSelector() {
  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedCountry = localStorage.getItem('twns_country');
    const storedLanguage = localStorage.getItem('twns_language');
    if (storedCountry) setSelectedCountry(storedCountry);
    if (storedLanguage) setSelectedLanguage(storedLanguage);
  }, []);

  const saveSelection = () => {
    localStorage.setItem('twns_country', selectedCountry);
    localStorage.setItem('twns_language', selectedLanguage);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="country-language-selector">
      <label>
        Country:
        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
          {COUNTRIES.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Language:
        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </label>
      <button onClick={saveSelection} disabled={saved}>
        {saved ? 'Saved!' : 'Save Selection'}
      </button>
    </div>
  );
}
