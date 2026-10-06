import {LanguageProvider} from '@/lib/language';
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Data Analysis Agent",
  description: "An intelligent workspace for exploring datasets, discovering patterns and making informed decisions.",
  icons: {
    icon: "/favicon.svg?v=cream",
    shortcut: "/favicon.svg?v=cream",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
