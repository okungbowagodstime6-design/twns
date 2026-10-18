import { Suspense } from "react";
import type { Metadata } from "next";
import AuthForm from "../../components/AuthForm";

export const metadata: Metadata = { title: "Sign in | TWNS" };

export default function SignInPage() {
  return <Suspense fallback={<main className="auth-page"><p>Loading sign-in...</p></main>}><AuthForm mode="sign-in" /></Suspense>;
}
