import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TWNSHeader from "../components/TWNSHeader";

export default function NotFound() {
  return (
    <main>
      <TWNSHeader />
      <section className="route-hero">
        <p className="section-kicker">404 — Not found</p>
        <h1>Story unavailable</h1>
        <p>This article may have been removed or the link may be incorrect.</p>
      </section>
      <div className="content-shell">
        <Link href="/" className="text-link">
          <ArrowLeft size={14} /> Back to the front page
        </Link>
      </div>
    </main>
  );
}
