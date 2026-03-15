import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/ui/Navbar";

/**
 * next/font/google downloads Inter at build time and injects it as a
 * CSS variable — no external <link> tag at runtime. This is the Next.js
 * idiomatic approach and avoids a <head> management conflict with the
 * App Router that was causing React hydration error #418.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "PowerWorld Gyms - Sri Lanka's Premier Fitness Network",
    template: "%s | PowerWorld Gyms",
  },
  description:
    "The largest fitness network in Sri Lanka. State-of-the-art facilities, expert trainers, and personalized workout plans. Join PowerWorld Gyms today.",
  keywords: [
    "gym",
    "fitness",
    "Sri Lanka",
    "Kiribathgoda",
    "PowerWorld",
    "workout",
    "personal training",
  ],
  authors: [{ name: "PowerWorld Gyms" }],
  openGraph: {
    type: "website",
    locale: "en_LK",
    siteName: "PowerWorld Gyms",
    title: "PowerWorld Gyms - Sri Lanka's Premier Fitness Network",
    description:
      "State-of-the-art facilities, expert trainers, and personalized workout plans.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e1e1e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-app text-white antialiased font-sans">
        <Providers>
        <Navbar />
        {children}
      </Providers>
      </body>
    </html>
  );
}
