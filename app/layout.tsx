import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import LayoutContent from "@/components/LayoutContent";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuki - Your Money, Always Working",
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
    title: "Yuki - Your Money, Always Working",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <body className="font-mabrypro min-h-screen bg-[#0a0a0a] text-white grain-overlay">
          <Providers>
            <LayoutContent>{children}</LayoutContent>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
