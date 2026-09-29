import Link from 'next/link';
import React from 'react';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Breaking', href: '/breaking' },
  { name: 'Business', href: '/business' },
  { name: 'Category', href: '/category' },
  { name: 'Country', href: '/country' },
  { name: 'Entertainment', href: '/entertainment' },
  { name: 'Personalize', href: '/personalize' },
  { name: 'Saved', href: '/saved' },
  { name: 'Profile', href: '/profile' },
  { name: 'Settings', href: '/settings' },
  { name: 'Sports', href: '/sports' },
  { name: 'Tech', href: '/tech' },
  { name: 'World', href: '/world' },
];

export default function NavBar() {
  return (
    <nav style={{ padding: '1rem', backgroundColor: '#222', color: '#fff' }}>
      <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '1rem' }}>
        {navItems.map(({ name, href }) => (
          <li key={href}>
            <Link href={href} style={{ color: 'white', textDecoration: 'none' }}>
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
