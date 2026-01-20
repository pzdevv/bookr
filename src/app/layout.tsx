import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/use-auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bookr - Modern Appointment Scheduling",
  description: "Schedule appointments effortlessly with Bookr. The modern scheduling platform for professionals with free audio calls.",
  keywords: ["scheduling", "appointments", "booking", "calendar", "meetings", "audio calls", "free"],
  authors: [{ name: "Bookr" }],
  creator: "Bookr",
  publisher: "Bookr",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bookr.app",
    siteName: "Bookr",
    title: "Bookr - Modern Appointment Scheduling",
    description: "Schedule appointments effortlessly with Bookr. Free audio calls included.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Bookr - Modern Appointment Scheduling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bookr - Modern Appointment Scheduling",
    description: "Schedule appointments effortlessly with Bookr. Free audio calls included.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.variable} font-[Inter,sans-serif] antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
