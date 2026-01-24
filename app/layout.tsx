import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutContent from "@/components/LayoutContent";
import { Providers } from "./providers";
import { Geist, Geist_Mono } from 'next/font/google'
import "./globals.css";

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})



export const metadata: Metadata = {
  title: "Yuki | App",
  description: "A new kind of money app. Your balance earns while you spend, send, and live. Non-custodial and transparent by design.",
  metadataBase: new URL("https://app.yuki.fi"),
  keywords: ["savings", "yield", "crypto", "DeFi", "money app", "earn", "non-custodial"],
  authors: [{ name: "Yuki Protocol" }],
  creator: "Yuki Protocol",
  openGraph: {
    title: "Yuki - Your Money, Always Working",
    description: "A new kind of money app. Your balance earns while you spend, send, and live. Non-custodial and transparent by design.",
    url: "https://yuki.fi",
    siteName: "Yuki",
    images: [
      {
        url: "/images/OG.png",
        width: 1200,
        height: 630,
        alt: "Yuki - Your Money, Always Working",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuki | Your Money, Always Working",
    description: "A new kind of money app. Your balance earns while you spend, send, and live.",
    images: ["/images/OG.png"],
    creator: "@yukiprotocol",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "manifest",
        url: "/site.webmanifest",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/login?su"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html 
        lang="en" 
        className="scroll-smooth"
        style={{ backgroundColor: '#0f0f12', colorScheme: 'dark' }}
      >
        <head>
          {/* Prevent background flash - set background before any CSS loads */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  document.documentElement.style.backgroundColor = '#0f0f12';
                  document.documentElement.style.colorScheme = 'dark';
                })();
              `,
            }}
          />
          {/* Preload critical CSS */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
                html, body { 
                  background-color: #0f0f12; 
                  color: #ffffff;
                  color-scheme: dark;
                }
                /* Prevent layout shift - pre-allocate sidebar width */
                :root {
                  --sidebar-width: 16rem;
                  --sidebar-width-collapsed: 3rem;
                }
              `,
            }}
          />
        </head>
        <body className={`${geist.className} ${geistMono.variable} min-h-screen bg-[#0f0f12] text-white antialiased`}>
          <Providers>
            <LayoutContent>{children}</LayoutContent>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
