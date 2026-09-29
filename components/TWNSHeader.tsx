"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Menu, Search, User } from "lucide-react";

const navItems = [
  { label: "HOME", href: "/" },
  { label: "MY COUNTRY", href: "/my-country" },
  { label: "WORLD", href: "/world" },
  { label: "BREAKING", href: "/breaking" },
  { label: "BUSINESS", href: "/business" },
  { label: "TECH", href: "/tech" },
  { label: "SPORTS", href: "/sports" },
  { label: "ENTERTAINMENT", href: "/entertainment" },
  { label: "MORE", href: "/more" }
];

export default function TWNSHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <button
          className="icon-button mobile-menu"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <Menu size={18} />
        </button>

        <Link href="/" className="brand" aria-label="The World News Station home">
          <span className="brand-mark">TW</span>
          <span>
            <strong>TWNS</strong>
            <small>The World News Station</small>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="icon-button" href="/search" aria-label="Search">
            <Search size={18} />
          </Link>
          <Link className="icon-button" href="/settings#notifications" aria-label="Notifications">
            <Bell size={18} />
          </Link>
          <Link className="profile-link" href="/profile">
            <User size={16} />
            <span>Profile</span>
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
