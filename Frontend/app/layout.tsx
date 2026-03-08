import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-black text-white antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
