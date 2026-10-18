"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { browserSupabase } from "../lib/supabase/browser";
import SearchableOptionPicker, { type SearchableOption } from "./SearchableOptionPicker";
import { ALL_COUNTRIES, getCountryByCode } from "../lib/constants/countries";
import { ALL_LANGUAGES, getLanguageByCode } from "../lib/constants/languages";

type AuthFormProps = { mode: "sign-in" | "sign-up" };

const countryOptions: SearchableOption[] = ALL_COUNTRIES.map((country) => ({ code: country.code, label: country.name, searchText: country.name, icon: country.flag, detail: country.code }));
const languageOptions: SearchableOption[] = ALL_LANGUAGES.map((language) => ({ code: language.code, label: language.name, searchText: `${language.name} ${language.nativeName}`, detail: language.nativeName !== language.name ? language.nativeName : language.code }));

function safeReturnPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/sign-in") || path.startsWith("/sign-up")) return "/settings/profile";
  return path;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("NG");
  const [languageCode, setLanguageCode] = useState("en");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const isSignUp = mode === "sign-up";
  const queryError = searchParams.get("error");
  const queryReason = searchParams.get("reason");
  const notice = queryError === "confirmation"
    ? "We could not confirm your email. Please request a new confirmation link or sign in."
    : queryReason === "configuration"
      ? "Account services are not configured. Please contact the site administrator."
      : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!browserSupabase) {
      setMessage("Sign-in is temporarily unavailable because Supabase is not configured.");
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    setPending(true);
    setMessage("");
    try {
      const result = isSignUp
        ? await browserSupabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fprofile`,
              data: { full_name: fullName.trim(), country_code: countryCode, language_code: languageCode }
            }
          })
        : await browserSupabase.auth.signInWithPassword({ email: email.trim(), password });

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      if (isSignUp && !result.data.session) {
        setMessage("Your account is ready. Check your email to confirm your address, then sign in.");
        return;
      }

      router.replace(safeReturnPath(searchParams.get("next")));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
        <Link href="/" className="auth-panel-brand"><span className="twns-navbar-mark">TW</span><span>TWNS</span></Link>
        <p className="auth-panel-kicker">THE WORLD NEWS STATION</p>
        <h1 id="auth-title">{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-panel-copy">{isSignUp ? "Make the world’s news more relevant to you." : "Sign in to continue to your TWNS account."}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && <><label htmlFor="auth-full-name">Full name</label><input id="auth-full-name" type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></>}
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
          {isSignUp && <div className="auth-preference-fields">
            <span>Home country</span><SearchableOptionPicker label="Home country" selectedCode={countryCode} selectedLabel={getCountryByCode(countryCode)?.name ?? "Nigeria"} options={countryOptions} onSelect={setCountryCode} />
            <span>Reading language</span><SearchableOptionPicker label="Reading language" selectedCode={languageCode} selectedLabel={getLanguageByCode(languageCode)?.name ?? "English"} options={languageOptions} onSelect={setLanguageCode} />
          </div>}
          <button className="auth-submit" type="submit" disabled={pending}>
            {pending ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        {(message || notice) && <p className="auth-feedback" role="status">{message || notice}</p>}
        <p className="auth-switch">
          {isSignUp ? "Already have an account? " : "New to TWNS? "}
          <Link href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link>
        </p>
        <Link href="/" className="auth-back">Return to the newsroom</Link>
      </section>
    </main>
  );
}
