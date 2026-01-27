import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/use-auth";
import { QueryProvider } from "@/lib/providers/query-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Book&Call - Professional Appointment Scheduling",
  description: "Schedule appointments effortlessly with Book&Call. The premium scheduling platform for professionals available at bookncall.me. Features audio calls and smart calendar syncing.",
  keywords: ["scheduling", "appointments", "booking", "calendar", "meetings", "audio calls", "free", "book&call", "bookncall", "bookncall.me", "book and call"],
  authors: [{ name: "Book&Call" }],
  creator: "Book&Call",
  publisher: "Book&Call",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon-light.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon-light.png", sizes: "192x192", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", sizes: "192x192", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/favicon-dark.png",
    shortcut: "/favicon-dark.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bookncall.me",
    siteName: "Book&Call",
    title: "Book&Call - Professional Appointment Scheduling",
    description: "Schedule appointments effortlessly with Book&Call. Free audio calls included.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Book&Call - Professional Appointment Scheduling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book&Call - Professional Appointment Scheduling",
    description: "Schedule appointments effortlessly with Book&Call. Free audio calls included.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-[Inter,sans-serif] antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
