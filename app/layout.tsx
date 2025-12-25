import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuki",
  description: "Institutional-grade DeFi yields, simplified. Earn high yields on your idle assets with self-custody and zero trust required.",
  metadataBase: new URL("https://app.yuki.fi"),
  openGraph: {
    title: "Yuki",
    description: "Institutional-grade DeFi yields, simplified. Earn high yields on your idle assets with self-custody and zero trust required.",
    url: "https://app.yuki.fi",
    siteName: "Yuki Protocol",
    images: [
      {
        url: "/images/OG.png",
        width: 1200,
        height: 630,
        alt: "Yuki Protocol - DeFi Yields Simplified",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuki",
    description: "Institutional-grade DeFi yields, simplified. Earn high yields on your idle assets with self-custody and zero trust required.",
    images: ["/images/OG.png"],
    creator: "@yukiprotocol",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-mabrypro min-h-screen bg-dark-900 text-fdfffc">
        <Providers>
          <div className="fixed inset-0 bg-[url('/images/grid.svg')] opacity-5 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none"></div>
          <div className="relative z-10">
            <Navbar />
            <main className="pt-8 px-6 max-w-2xl mx-auto">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
