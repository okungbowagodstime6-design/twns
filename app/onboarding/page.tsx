"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import TWNSHeader from "../../components/TWNSHeader";

const interests = ["World", "Nigeria", "Business", "Technology", "Sports", "Culture"];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>(["World", "Nigeria"]);
  const toggleInterest = (interest: string) => setSelected((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);

  return (
    <main>
      <TWNSHeader />
      <section className="route-hero"><p className="section-kicker">PERSONALIZE YOUR SIGNAL</p><h1>Choose what stays close.</h1><p>Build a daily brief around the subjects and places you care about most.</p></section>
      <section className="content-shell preference-content">
        <div className="interest-picker">
          {interests.map((interest) => <button className={`interest-option ${selected.includes(interest) ? "is-selected" : ""}`} type="button" onClick={() => toggleInterest(interest)} key={interest}>{selected.includes(interest) && <Check size={16} />} {interest}</button>)}
        </div>
        <div className="preference-footer"><span>{selected.length} interests selected</span><Link className="button button-dark" href="/">Open my brief <ArrowRight size={17} /></Link></div>
      </section>
    </main>
  );
}
