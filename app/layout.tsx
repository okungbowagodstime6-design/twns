import type { Metadata } from "next";
import TWNSHeader from "@/components/TWNSHeader";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "TWNS | The World News Station",
  description: "The World's News. Personalized for You."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TWNSHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
