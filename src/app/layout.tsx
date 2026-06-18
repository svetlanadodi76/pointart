import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PointArt — Scheme pentru lucrări manuale",
    template: "%s | PointArt",
  },
  description:
    "Generează scheme pentru broderie în cruciulițe, goblene și picturi cu diamante din orice fotografie. Culori DMC, simboluri, export PDF.",
  keywords: [
    "scheme broderie", "broderie cruciulite", "goblene", "pictura diamante",
    "DMC", "punct cruciulit", "схемы вышивки", "вышивка крестом",
    "PointArt", "Moldova",
  ],
  authors: [{ name: "PointArt" }],
  creator: "PointArt",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pointart.md"),
  openGraph: {
    type: "website",
    locale: "ro_MD",
    alternateLocale: "ru_MD",
    title: "PointArt — Scheme pentru lucrări manuale",
    description:
      "Generează scheme pentru broderie, goblene și picturi cu diamante din orice fotografie. Culori DMC, export PDF.",
    siteName: "PointArt",
  },
  twitter: {
    card: "summary_large_image",
    title: "PointArt — Scheme pentru lucrări manuale",
    description: "Generează scheme pentru broderie, goblene și picturi cu diamante.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
