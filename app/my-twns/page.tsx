import TWNSHeader from "../../components/TWNSHeader";
import MyTwnsFeed from "../../components/MyTwns";

export default function MyTwnsPage() {
  return <main className="my-twns-page"><TWNSHeader /><section className="route-hero my-twns-hero"><p className="section-kicker">YOUR PERSONAL NEWS DESK</p><h1>My TWNS</h1><p>A world station tuned to the places, languages, and subjects you follow.</p></section><section className="content-shell my-twns-content"><MyTwnsFeed /></section></main>;
}
