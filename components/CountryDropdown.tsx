"use client";

import countries from "../lib/countries.json";
import { Check, ChevronDown, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_COUNTRY_CODE = "NG";
const STORAGE_KEY = "twns_country";

export default function CountryDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedCode, setSelectedCode] = useState(DEFAULT_COUNTRY_CODE);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = countries.find((country) => country.code === selectedCode) ?? countries[0];
  const filteredCountries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return countries;
    return countries.filter((country) =>
      country.name.toLocaleLowerCase().includes(query) || country.code.toLowerCase().includes(query)
    );
  }, [search]);

  useEffect(() => {
    const routeCode = pathname.match(/^\/country\/([a-z]{2})(?:\/|$)/i)?.[1];
    let storedCode: string | null = null;
    try {
      storedCode = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // The route or default country remains usable when storage is unavailable.
    }
    const preferredCode = routeCode ?? storedCode?.toUpperCase();
    if (preferredCode && countries.some((country) => country.code === preferredCode)) {
      setSelectedCode(preferredCode);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectCountry(code: string) {
    setSelectedCode(code);
    setIsOpen(false);
    setSearch("");
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Navigation does not depend on browser storage.
    }
    window.dispatchEvent(new Event("twns_country_changed"));
    router.push(`/country/${code}`);
  }

  return (
    <div ref={dropdownRef} className="relative w-full sm:w-64">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Choose country. Current country: ${selectedCountry.name}`}
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="text-xl leading-none">{selectedCountry.flag}</span>
          <span className="truncate">{selectedCountry.name}</span>
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{selectedCountry.code}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-full min-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2.5 dark:border-slate-800">
            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              <Search size={16} aria-hidden="true" className="shrink-0" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search countries or code"
                aria-label="Search countries by name or ISO-2 code"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </label>
          </div>
          <ul role="listbox" aria-label="Countries" className="max-h-[min(60vh,24rem)] overflow-y-auto overscroll-contain p-1.5">
            {filteredCountries.map((country) => (
              <li key={country.code} role="option" aria-selected={country.code === selectedCode}>
                <button
                  type="button"
                  onClick={() => selectCountry(country.code)}
                  className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span aria-hidden="true" className="text-lg leading-none">{country.flag}</span>
                  <span className="min-w-0 flex-1 truncate">{country.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{country.code}</span>
                  {country.code === selectedCode && <Check size={16} aria-hidden="true" className="text-blue-600 dark:text-blue-400" />}
                </button>
              </li>
            ))}
            {filteredCountries.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                No countries match “{search}”.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
