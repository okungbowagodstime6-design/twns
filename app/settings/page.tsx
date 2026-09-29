import Link from "next/link";
import { ArrowLeft, Bell, Globe2, Languages, MapPin, Settings2 } from "lucide-react";
import TWNSHeader from "../../components/TWNSHeader";

const settings = [{ label: "COUNTRY", title: "Nigeria", icon: MapPin }, { label: "LANGUAGE", title: "English", icon: Languages }, { label: "NOTIFICATIONS", title: "Not configured", icon: Bell }, { label: "PERSONALIZATION", title: "Manage interests", icon: Settings2 }, { label: "REGION", title: "Global coverage", icon: Globe2 }];

export default function SettingsPage() {
  return <main><TWNSHeader /><section className="route-hero"><p className="section-kicker">ACCOUNT SETTINGS</p><h1>Keep TWNS useful.</h1><p>Manage your country, language, personalization, and notification preferences.</p></section><section className="content-shell settings-content"><Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link><div className="settings-list">{settings.map(({ label, title, icon: Icon }) => <div className="setting-row" key={label}><Icon size={20} /><div><p className="section-kicker">{label}</p><h2>{title}</h2></div><span className="setting-status">Foundation</span></div>)}</div><Link href="/personalize" className="button button-dark">Personalize my signal</Link></section></main>;
}
