import type { Metadata } from "next";
import "./globals.css";
import NavBar from '../components/NavBar';

export const metadata: Metadata = {
  title: "TWNS | The World News Station",
  description: "The World's News. Personalized for You."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
  <NavBar />
  {children}
</body>
    </html>
  );
}
