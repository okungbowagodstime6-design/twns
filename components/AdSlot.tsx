"use client";

import { useEffect, useRef, useState } from "react";

type AdSlotType = "leaderboard" | "sidebar" | "inFeed";
type Props = {
  slotType: AdSlotType;
  slotId?: string;
  sidebarHeight?: 250 | 600;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function AdSlot({ slotType, slotId, sidebarHeight = 250, className = "" }: Props) {
  const adRef = useRef<HTMLModElement>(null);
  const [adReady, setAdReady] = useState(false);
  const canRenderAd = Boolean(adsenseClient && slotId);

  useEffect(() => {
    if (!canRenderAd || !adRef.current) return;

    let cancelled = false;
    const scriptSelector = 'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';
    let script = document.querySelector<HTMLScriptElement>(scriptSelector);

    const markReady = () => {
      if (!cancelled) setAdReady(true);
    };

    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient!)}`;
      script.addEventListener("load", markReady, { once: true });
      document.head.appendChild(script);
    } else if (window.adsbygoogle) {
      markReady();
    } else {
      script.addEventListener("load", markReady, { once: true });
    }

    return () => {
      cancelled = true;
      script?.removeEventListener("load", markReady);
    };
  }, [canRenderAd]);

  useEffect(() => {
    if (!canRenderAd || !adReady || !adRef.current || adRef.current.dataset.requested === "true") return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      adRef.current.dataset.requested = "true";
    } catch {
      adRef.current.dataset.adUnavailable = "true";
    }
  }, [adReady, canRenderAd]);

  const sizeClass = slotType === "leaderboard"
    ? "ad-slot-leaderboard"
    : slotType === "sidebar"
      ? `ad-slot-sidebar ad-slot-sidebar-${sidebarHeight}`
      : "ad-slot-infeed";

  return (
    <aside className={`ad-slot ${sizeClass} ${className}`.trim()} aria-label="Advertisement">
      <span className="ad-slot-label">ADVERTISEMENT</span>
      <div className="ad-slot-frame">
        {canRenderAd && (
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={adsenseClient}
            data-ad-slot={slotId}
            data-ad-format={slotType === "inFeed" ? "fluid" : "auto"}
            data-full-width-responsive="true"
          />
        )}
      </div>
    </aside>
  );
}
