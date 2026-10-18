"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

export type SearchableOption = { code: string; label: string; searchText: string; icon?: string; detail?: string };
type Props = { label: string; selectedCode: string; selectedLabel: string; options: SearchableOption[]; onSelect: (code: string) => void; disabled?: boolean };

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export default function SearchableOptionPicker({ label, selectedCode, selectedLabel, options, onSelect, disabled = false }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredOptions = query.trim()
    ? options.filter((option) => normalized(`${option.label} ${option.searchText} ${option.code}`).includes(normalized(query.trim())))
    : options;

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); setQuery(""); }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function choose(code: string) {
    onSelect(code);
    setOpen(false);
    setQuery("");
  }

  return <div className="reference-picker" ref={rootRef}>
    <button className="reference-picker-trigger" type="button" aria-label={`${label}: ${selectedLabel}`} aria-haspopup="listbox" aria-expanded={open} disabled={disabled} title={`${label}: ${selectedLabel}`} onClick={() => setOpen((current) => !current)}>
      <span className="reference-picker-current">{options.find((option) => option.code === selectedCode)?.icon && <span aria-hidden="true">{options.find((option) => option.code === selectedCode)?.icon}</span>}{selectedLabel}</span><ChevronDown size={14} aria-hidden="true" />
    </button>
    {open && <div className="reference-picker-popover">
      <label className="reference-picker-search"><Search size={15} /><span className="sr-only">Search {label.toLowerCase()} options</span><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}...`} autoComplete="off" /><button type="button" onClick={() => setQuery("")} aria-label={`Clear ${label.toLowerCase()} search`} disabled={!query}><X size={14} /></button></label>
      <div className="reference-picker-options" role="listbox" aria-label={`Select ${label.toLowerCase()}`}>
        {filteredOptions.map((option) => <button className="reference-picker-option" type="button" role="option" aria-selected={option.code === selectedCode} key={option.code} onClick={() => choose(option.code)}>
          {option.icon && <span aria-hidden="true">{option.icon}</span>}<span>{option.label}</span>{option.detail && <small>{option.detail}</small>}
        </button>)}
        {!filteredOptions.length && <p className="reference-picker-empty">No matches found.</p>}
      </div>
    </div>}
  </div>;
}
