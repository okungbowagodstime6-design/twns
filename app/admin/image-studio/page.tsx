import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TWNSHeader from "../../../components/TWNSHeader";
import ImageStudio from "../../../components/ImageStudio";

export default function ImageStudioPage() {
  return <main>
    <TWNSHeader />
    <section className="route-hero studio-route-hero"><p className="section-kicker">TWNS NEWSROOM</p><h1>Image preparation</h1><p>Editorial cropping and branding for article media.</p></section>
    <section className="content-shell studio-route-content">
      <Link href="/admin" className="text-link"><ArrowLeft size={16} /> Back to newsroom</Link>
      <ImageStudio />
    </section>
  </main>;
}
