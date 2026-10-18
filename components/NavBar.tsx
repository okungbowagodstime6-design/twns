"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Search } from "lucide-react";
import CountrySelector from "./CountrySelector";
import LanguageSelector from "./LanguageSelector";
import SearchModal from "./SearchModal";
import { browserSupabase } from "../lib/supabase/browser";

const navItems = [
  { name: "Home", href: "/" },
  { name: "World", href: "/world" },
  { name: "Breaking", href: "/breaking" },
  { name: "My TWNS", href: "/my-twns" },
  { name: "Business", href: "/business" },
  { name: "Technology", href: "/tech" },
  { name: "Sports", href: "/sports" }
];

export default function NavBar() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!browserSupabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    browserSupabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: { subscription } } = browserSupabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (!browserSupabase) return;
    setSigningOut(true);
    setAuthError("");
    const { error } = await browserSupabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      setAuthError("We could not sign you out. Please try again.");
      return;
    }
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <header className="twns-navbar bg-[#090d16] text-slate-50">
      <div className="twns-navbar-top flex items-center justify-between">
        <Link href="/" className="twns-navbar-brand flex items-center" aria-label="The World News Station home">
          <span className="twns-navbar-mark bg-red-600" aria-hidden="true">TW</span>
          <span className="twns-navbar-wordmark">TWNS</span>
        </Link>
        <nav className="twns-navbar-account flex items-center" aria-label="Account navigation">
          <button className="twns-navbar-search" type="button" aria-label="Open global search" title="Search TWNS" onClick={() => setSearchOpen(true)}><Search size={17} /></button>
          <CountrySelector />
          <LanguageSelector />
          {loading ? <span className="twns-navbar-status" aria-live="polite">Checking session...</span> : session ? <>
            <Link className="twns-navbar-profile" href="/settings/profile">Profile</Link>
            <button className="twns-navbar-signout" type="button" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </> : <>
            <Link className="twns-navbar-signin" href="/sign-in">Sign in</Link>
            <Link className="twns-navbar-signup" href="/sign-up">Sign up</Link>
          </>}
        </nav>
      </div>
      <nav className="twns-navbar-sections flex items-center overflow-x-auto" aria-label="Main navigation">
        {navItems.map(({ name, href }) => <Link href={href} key={href}>{name}</Link>)}
      </nav>
      {authError && <p className="twns-navbar-error" role="alert">{authError}</p>}
      {searchOpen && <SearchModal mode="dialog" onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
