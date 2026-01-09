import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pokémon TCG MasterList Generator",
  description: "Generate complete Pokémon TCG master lists by Pokémon or expansion in one click, including every known English card variant, and export them instantly for custom editing.",
};

export default function RootLayout({ children }) {
  return (
        <html lang="en">
      <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pokémon TCG Masterlist Generator</title>
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <meta name="description" content="Generate complete Pokémon TCG master lists by Pokémon or expansion in one click, including every known English card variant, and export them instantly for custom editing." />
  <meta property="og:title" content="Pokémon TCG Masterlist Generator" />
  <meta property="og:description" content="Generate complete Pokémon TCG master lists by Pokémon or expansion in one click, including every known English card variant, and export them instantly for custom editing." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={siteUrl} />
  <meta property="og:image" content={`${siteUrl}/preview.png`} />
  <meta name="twitter:card" content="summary_large_image" />
</head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
