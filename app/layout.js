import { Geist, Geist_Mono } from "next/font/google";
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
  description: "Search and explore every English Pokémon TCG card by name or expansion.",
};

export default function RootLayout({ children }) {
  return (
        <html lang="en">
      <head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pokémon TCG Masterlist Generator</title>
  <meta name="description" content="Search and explore every English Pokémon TCG card by name or expansion." />
  <meta property="og:title" content="Pokémon TCG Masterlist Generator" />
  <meta property="og:description" content="Search and explore every English Pokémon TCG card by name or expansion." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={siteUrl} />
  <meta property="og:image" content={`${siteUrl}/preview.png`} />
  <meta name="twitter:card" content="summary_large_image" />
</head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
