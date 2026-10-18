import Link from "next/link";
import { ALL_COUNTRIES } from "@/lib/constants/countries";

export default function CountriesPage() {
  return (
    <main>
      <section className="route-hero">
        <p className="section-kicker">GLOBAL COVERAGE</p>
        <h1>News from 195 countries.</h1>
        <p>Choose a country to browse its reporting by politics, economy, crime and society, or government.</p>
      </section>
      <section className="content-shell route-content">
        <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_COUNTRIES.map((country) => (
            <li key={country.code}>
              <Link
                className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                href={`/country/${country.code.toLowerCase()}`}
              >
                <span aria-hidden="true">{country.flag}</span>
                <span className="font-semibold">{country.name}</span>
                <span className="ml-auto text-xs text-slate-500">{country.code}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
