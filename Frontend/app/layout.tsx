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
  applicationName: "GymSphere",
  title: {
    default: "GymSphere - Gym Management Suite",
    template: "%s | GymSphere",
  },
  description:
    "A modern gym management suite with member tools, trainer workflows, operations dashboards, and reporting.",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "GymSphere",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  keywords: [
    "gym",
    "fitness",
    "GymSphere",
    "Gym Management Suite",
    "fitness operations",
    "workout",
    "personal training",
  ],
  authors: [{ name: "GymSphere" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GymSphere",
    title: "GymSphere - Gym Management Suite",
    description:
      "Member, trainer, manager, and admin workflows in one platform.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e1e1e",
  viewportFit: "cover",
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
