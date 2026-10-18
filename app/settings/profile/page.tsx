import type { Metadata } from "next";
import ProfileSettings from "../../../components/ProfileSettings";

export const metadata: Metadata = { title: "Profile settings | TWNS" };

export default function ProfileSettingsPage() {
  return <main><section className="route-hero"><p className="section-kicker">ACCOUNT PROFILE</p><h1>Your TWNS, your signal.</h1><p>Update your profile and the coverage you want to follow.</p></section><section className="content-shell profile-settings-content"><ProfileSettings /></section></main>;
}