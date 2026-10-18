"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Menu, Search, User } from "lucide-react";
import { browserSupabase } from "@/lib/supabase/browser";
import AdSlot from "@/components/AdSlot";

const navItems = [
  { label: "HOME", href: "/" },
  { label: "MY COUNTRY", href: "/my-country" },
  { label: "COUNTRIES", href: "/countries" },
  { label: "WORLD", href: "/world" },
  { label: "BREAKING", href: "/breaking" },
  { label: "BUSINESS", href: "/business" },
  { label: "TECH", href: "/tech" },
  { label: "SPORTS", href: "/sports" },
  { label: "ENTERTAINMENT", href: "/entertainment" },
  { label: "MORE", href: "/more" }
];

const categoryItems = [
  { label: "Finance", href: "/category/finance", paths: ["/category/finance"] },
  { label: "Crypto", href: "/category/crypto", paths: ["/category/crypto"] },
  { label: "Tech", href: "/tech", paths: ["/tech", "/category/technology"] },
  { label: "Health", href: "/category/health", paths: ["/category/health"] },
  { label: "Fintech", href: "/category/fintech", paths: ["/category/fintech"] }
];

export default function TWNSHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    if (!browserSupabase) return;

    browserSupabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });

    const { data: authListener } = browserSupabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setAuthMessage("");
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!browserSupabase) return;
    const { error } = await browserSupabase.auth.signOut();
    if (error) {
      setAuthMessage("Sign out failed. Please try again.");
      return;
    }
    setUserEmail(null);
    setAuthMessage("");
  }

  return (
    <>
    <header className="site-header">
      <div className="header-inner">
        <button
          className="icon-button mobile-menu"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <Menu size={18} />
        </button>

        <Link href="/" className="brand" aria-label="The World News Station home">
          <span className="brand-mark">TW</span>
          <span>
            <strong>TWNS</strong>
              <small>Powered by Chadash Olam Innovation Company — Forging the Future</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <div className="header-utility-actions">
          <Link className="icon-button" href="/search" aria-label="Search">
            <Search size={18} />
          </Link>
          <Link className="icon-button" href="/settings#notifications" aria-label="Notifications">
            <Bell size={18} />
          </Link>
          </div>
          <div className="header-auth-actions" aria-label="Account actions">
            {userEmail ? (
              <>
                <Link className="profile-link" href="/profile" title={userEmail}>
                  <User size={16} />
                  <span>Profile</span>
                </Link>
                <button className="auth-button auth-button-quiet" onClick={signOut} type="button">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link className="auth-button auth-button-quiet" href="/sign-in">Sign In</Link>
                <Link className="auth-button auth-button-primary" href="/sign-up">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <nav
        className="border-t border-slate-200/80 bg-white/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-950/80"
        aria-label="News categories"
      >
        <ul className="mx-auto flex max-w-6xl list-none items-center gap-2 overflow-x-auto p-0">
          {categoryItems.map((item) => {
            const isActive = item.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
            return (
              <li className="shrink-0" key={item.href}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {authMessage && <p className="header-auth-message" role="alert">{authMessage}</p>}

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
    <AdSlot slotType="leaderboard" slotId={process.env.NEXT_PUBLIC_ADSENSE_LEADERBOARD_SLOT} className="header-ad-slot" />
    </>
  );
}
