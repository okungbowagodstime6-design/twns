import Link from "next/link";

const filters = [
  { label: "All entertainment", value: "" },
  { label: "Global · Hollywood", value: "global" },
  { label: "Local · Nollywood", value: "local" }
];

export default function EntertainmentFilters({ selectedScope }: { selectedScope: string }) {
  return (
    <nav aria-label="Filter entertainment news" className="my-8 flex flex-wrap gap-2">
      {filters.map((filter) => {
        const href = filter.value ? `/entertainment?scope=${filter.value}` : "/entertainment";
        const active = filter.value === selectedScope;
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
