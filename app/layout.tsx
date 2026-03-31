import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0A1628",
};

export const metadata: Metadata = {
  title: "Charity Token - Empowering 1 Million Lives",
  description: "Receive 500 Charity tokens monthly for 10 years. Sign up, activate your account, and own a piece of the future.",
  metadataBase: new URL("https://charity-token.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://charity-token.vercel.app",
    title: "Charity Token - Empowering 1 Million Lives",
    description: "Receive 500 Charity tokens monthly for 10 years",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Charity Token - Empowering 1 Million Lives",
    description: "Receive 500 Charity tokens monthly for 10 years",
  },
  generator: 'v0.app'
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
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}