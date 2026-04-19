import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import { PWARegister } from "@/components/pwa-register";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#00CEC9",
};

export const metadata: Metadata = {
  title: "Charity Token - Empowering 1 Million Lives",
  description: "Receive 500 Charity tokens monthly for 10 years. Sign up, activate your account, and own a piece of the future.",
  metadataBase: new URL("https://www.charitytoken.net"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Charity Token",
    startupImage: "/icons/icon-512.png",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.charitytoken.net",
    title: "Charity Token - Empowering 1 Million Lives",
    description: "Receive 500 Charity tokens monthly for 10 years",
    images: [{ url: "/Charity token logo.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Charity Token - Empowering 1 Million Lives",
    description: "Receive 500 Charity tokens monthly for 10 years",
    images: ["/Charity token logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#00CEC9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Charity Token" />
        <meta name="application-name" content="Charity Token" />
        <meta name="msapplication-TileColor" content="#020C1B" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />

        {/* Icons */}
        <link rel="icon" href="/icons/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
          body {
            width: 100%;
            min-height: 100vh;
            background-color: #0A1628;
            color: #F0F4F8;
            -webkit-font-smoothing: antialiased;
          }
          #__next, main { width: 100%; }
        `}</style>
      </head>
      <body className="w-full min-h-screen bg-[#0A1628]">
        {/* Pi Network SDK */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <Script id="pi-sdk-init" strategy="afterInteractive">{`
          if (typeof window !== 'undefined' && window.Pi) {
            window.Pi.init({ version: "2.0", sandbox: false });
          }
        `}</Script>

        {/* PWA Service Worker Registration */}
        <PWARegister />

        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}