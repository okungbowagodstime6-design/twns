import { Suspense } from "react";
import type { Metadata } from "next";
import AuthForm from "../../components/AuthForm";

export const metadata: Metadata = { title: "Create account | TWNS" };

export default function SignUpPage() {
  return <Suspense fallback={<main className="auth-page"><p>Loading sign-up...</p></main>}><AuthForm mode="sign-up" /></Suspense>;
}
