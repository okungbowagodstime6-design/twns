import countriesData from "../countries.json";

export type Country = { code: string; name: string; flag: string };

export const ALL_COUNTRIES: Country[] = countriesData;

export function getCountryByCode(code: string) {
  const normalized = code.trim().toUpperCase();
  return ALL_COUNTRIES.find((country) => country.code === normalized);
}
