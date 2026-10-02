import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TWNS | The World News Station",
  description: "The World's News. Personalized for You."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
