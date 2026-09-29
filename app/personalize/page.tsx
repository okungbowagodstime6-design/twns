"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import TWNSHeader from "../../components/TWNSHeader";

const choices = ["Nigeria", "World", "Business", "Technology", "Sports", "Culture"];

export default function PersonalizePage() {
  const [selected, setSelected] = useState(["Nigeria", "World"]);
  const toggle = (choice: string) => setSelected((items) => items.includes(choice) ? items.filter((item) => item !== choice) : [...items, choice]);
  return <main><TWNSHeader /><section className="route-hero"><p className="section-kicker">PERSONALIZATION</p><h1>Build your signal.</h1><p>Choose a country and topics. Preferences are stored locally until account persistence is connected.</p></section><section className="content-shell preference-content"><Link href="/" className="text-link"><ArrowLeft size={16} /> Back to the front page</Link><div className="interest-picker">{choices.map((choice) => <button type="button" className={`interest-option ${selected.includes(choice) ? "is-selected" : ""}`} onClick={() => toggle(choice)} key={choice}>{selected.includes(choice) && <Check size={16} />} {choice}</button>)}</div><div className="preference-footer"><span>{selected.length} selected</span><Link href="/my-country" className="button button-dark">Open my country desk</Link></div></section></main>;
}
