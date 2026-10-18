"use client";

import { useEffect, useState } from "react";

const supportedLanguages = new Set(["en", "fr", "es", "ha", "yo", "ig", "ar"]);

function readLanguage(): string {
  try {
    const storedLanguage = window.localStorage.getItem("twns_language")?.toLowerCase();
    return storedLanguage && supportedLanguages.has(storedLanguage) ? storedLanguage : "en";
  } catch {
    return "en";
  }
}

export function useLanguage(): string {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const syncLanguage = () => setLanguage(readLanguage());
    syncLanguage();
    window.addEventListener("twns_language_changed", syncLanguage);
    return () => window.removeEventListener("twns_language_changed", syncLanguage);
  }, []);

  return language;
}