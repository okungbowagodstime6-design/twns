"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const categories = [
  { label: "Breaking News", href: "/breaking", paths: ["/breaking"] },
  { label: "World", href: "/world", paths: ["/world"] },
  { label: "Politics", href: "/category/politics", paths: ["/category/politics"] },
  { label: "Business", href: "/business", paths: ["/business"] },
  { label: "Finance", href: "/category/finance", paths: ["/category/finance"] },
  { label: "Technology", href: "/tech", paths: ["/tech", "/category/technology"] },
  { label: "Sports", href: "/sports", paths: ["/sports"] },
  { label: "Science", href: "/category/science", paths: ["/category/science"] },
  { label: "Health", href: "/category/health", paths: ["/category/health"] },
  { label: "Education", href: "/category/education", paths: ["/category/education"] },
  { label: "Entertainment", href: "/entertainment", paths: ["/entertainment", "/category/entertainment"] },
  { label: "Agriculture", href: "/category/agriculture", paths: ["/category/agriculture"] },
  { label: "Environment", href: "/category/environment", paths: ["/category/environment"] },
  { label: "Security", href: "/category/security", paths: ["/category/security"] },
  { label: "Automotive", href: "/category/automotive", paths: ["/category/automotive"] }
];

export default function CategoryBar() {
  const pathname = usePathname();

  return (
    <div className="category-bar-shell" aria-label="News categories">
      <nav className="category-bar" aria-label="Browse news categories">
        {categories.map((category) => {
          const active = category.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`category-bar-link${active ? " is-active" : ""}`}
              href={category.href}
              key={category.label}
            >
              {category.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
