import { ALL_COUNTRIES } from "./constants/countries";

export const COUNTRIES = ALL_COUNTRIES;

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "es", name: "Spanish", nativeName: "Español" }
] as const;

export type CountryCode = string;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export interface UserPreferences {
  country_code: CountryCode;
  language_code: LanguageCode;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  country_code: CountryCode | null;
  language_code: LanguageCode | null;
  created_at: string;
  updated_at: string;
  preferred_categories: string[];
}

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && COUNTRIES.some((country) => country.code === value.toUpperCase());
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value);
}