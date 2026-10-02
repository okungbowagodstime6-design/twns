import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import TWNSHeader from "@/components/TWNSHeader";

export default function NewsPage() {
  return <main><TWNSHeader /><section className="route-hero"><p className="section-kicker">NEWSROOM</p><h1>News</h1><p>Choose a desk to begin reading verified TWNS coverage.</p></section><section className="content-shell"><div className="foundation-actions"><Link href="/world" className="button button-dark">World desk <ArrowUpRight size={17} /></Link><Link href="/breaking" className="button button-outline">Breaking desk <ArrowUpRight size={17} /></Link></div></section></main>;
}
