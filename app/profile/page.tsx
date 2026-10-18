"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import type { UserProfile } from "@/lib/user-preferences";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!browserSupabase) {
        if (active) {
          setMessage("Account services are temporarily unavailable.");
          setLoading(false);
        }
        return;
      }

      const { data: authData, error: authError } = await browserSupabase.auth.getUser();
      if (authError || !authData.user) {
        if (active) setLoading(false);
        return;
      }

      const { data, error } = await browserSupabase
        .from("profiles")
        .select("id, display_name, country_code, language_code, preferred_categories, created_at, updated_at")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!active) return;
      setEmail(authData.user.email ?? "");
      if (error) setMessage("Unable to load your profile.");
      else if (data) setProfile(data as UserProfile);
      setLoading(false);
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  async function signOut() {
    if (!browserSupabase) return;
    const { error } = await browserSupabase.auth.signOut();
    if (error) {
      setMessage("Unable to sign out. Please try again.");
      return;
    }
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <main>
      <section className="route-hero">
        <p className="section-kicker">YOUR TWNS</p>
        <h1>Your reading profile.</h1>
        <p>Manage the country, language, and interests used to personalize your brief.</p>
      </section>
      <section className="content-shell profile-content">
        <Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link>
        {loading ? <p className="mt-8" role="status">Loading your profile...</p> : !email ? (
          <div className="profile-panel">
            <div className="profile-icon"><UserRound size={28} /></div>
            <div>
              <p className="section-kicker">READER PROFILE</p>
              <h2>Sign in to personalize your news.</h2>
              <p>Your country, language, and interests will follow your account.</p>
              <Link href="/sign-in" className="button button-dark">Sign in <ArrowUpRight size={16} /></Link>
              <Link href="/sign-up" className="text-link">Create an account</Link>
            </div>
          </div>
        ) : (
          <div className="profile-panel">
            <div className="profile-icon"><UserRound size={28} /></div>
            <div>
              <p className="section-kicker">READER PROFILE</p>
              <h2>{profile?.display_name || email}</h2>
              <p>{email}</p>
              <p className="mt-4">Country: {profile?.country_code ?? "Not set"} · Language: {profile?.language_code ?? "Not set"}</p>
              <p>Interests: {profile?.preferred_categories?.length ? profile.preferred_categories.join(", ") : "Not set"}</p>
              <div className="hero-actions">
                <Link href="/onboarding" className="button button-dark">Edit preferences <ArrowUpRight size={16} /></Link>
                <button className="button button-outline-dark" onClick={signOut} type="button"><LogOut size={16} /> Sign out</button>
              </div>
            </div>
          </div>
        )}
        {message && <p className="admin-message mt-5" role="alert">{message}</p>}
      </section>
    </main>
  );
}
