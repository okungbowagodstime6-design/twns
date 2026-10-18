"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

type Props = { title: string };

export default function ArticleActions({ title }: Props) {
  const [copied, setCopied] = useState(false);
  const [encodedUrl, setEncodedUrl] = useState("");
  const encodedTitle = encodeURIComponent(title);

  useEffect(() => setEncodedUrl(encodeURIComponent(window.location.href)), []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return <nav className="editorial-share" aria-label="Share this article">
    <span className="editorial-share-label"><Share2 size={15} /> Share</span>
    <div className="editorial-share-actions">
      <button type="button" onClick={copyLink} aria-label={copied ? "Link copied" : "Copy article link"} title={copied ? "Link copied" : "Copy link"}>
        {copied ? <Check size={16} /> : <Copy size={16} />}<span>{copied ? "Copied" : "Copy link"}</span>
      </button>
      <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noreferrer" aria-label="Share on X" title="Share on X">𝕏</a>
      <a href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp" title="Share on WhatsApp">WA</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook" title="Share on Facebook">f</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn" title="Share on LinkedIn">in</a>
    </div>
  </nav>;
}
