import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import TWNSHeader from "../../components/TWNSHeader";

export default function SavedPage() {
  return <main><TWNSHeader /><section className="route-hero"><p className="section-kicker">YOUR LIBRARY</p><h1>Saved stories</h1><p>Keep useful reporting close for a later read.</p></section><section className="content-shell empty-route"><Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link><div className="empty-state-panel"><Bookmark size={32} /><h2>No saved stories yet.</h2><p>When saved article storage is connected, your bookmarks will appear here.</p><Link href="/world" className="button button-dark">Explore the world desk</Link></div></section></main>;
}
