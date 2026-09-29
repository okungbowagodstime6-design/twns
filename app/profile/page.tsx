import Link from "next/link";
import { ArrowLeft, ArrowUpRight, UserRound } from "lucide-react";
import TWNSHeader from "../../components/TWNSHeader";

export default function ProfilePage() {
  return (
    <main>
      <TWNSHeader />
      <section className="route-hero"><p className="section-kicker">YOUR TWNS</p><h1>Your reading profile.</h1><p>Your saved country, interests, and newsroom preferences will live here.</p></section>
      <section className="content-shell profile-content">
        <Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link>
        <div className="profile-panel"><div className="profile-icon"><UserRound size={28} /></div><div><p className="section-kicker">READER PROFILE</p><h2>Make the world more relevant.</h2><p>Personalize your feed to keep your country desk and favorite topics within reach.</p><Link href="/onboarding" className="text-link">Set my interests <ArrowUpRight size={16} /></Link></div></div>
      </section>
    </main>
  );
}
