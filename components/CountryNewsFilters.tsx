import Link from "next/link";

const filters = [
  { label: "All local news", value: "" },
  { label: "Politics", value: "politics" },
  { label: "Economy", value: "economy" },
  { label: "Crime & Social", value: "crime_social" },
  { label: "Government", value: "government" }
];

export default function CountryNewsFilters({
  countrySlug,
  selectedTopic
}: {
  countrySlug: string;
  selectedTopic: string;
}) {
  return (
    <nav aria-label="Filter country news" className="my-8 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const href = filter.value ? `/country/${countrySlug}?topic=${filter.value}` : `/country/${countrySlug}`;
        const active = filter.value === selectedTopic;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              active
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950"
                : "border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
            href={href}
            key={filter.value || "all"}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}
