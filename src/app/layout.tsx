import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import QueryProvider from "@/providers/QueryProvider";
import Navbar from "@/components/Navbar";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MarketAI - Akıllı Market & Ürün Arama Platformu",
  description: "Modern teknoloji ile yakınınızdaki marketleri ve en uygun ürün fiyatlarını bulun. Next.js 15, TypeScript ve AI destekli market deneyimi.",
  keywords: ["market", "alışveriş", "yakın market", "konum", "harita", "AI", "ürün arama"],
  authors: [{ name: "MarketAI Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased bg-[#FFEBD3] text-[#2D1E12] min-h-screen flex flex-col`}
      >
        <QueryProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="w-full py-3 text-center text-xs text-gray-500 border-t border-gray-200/20">
            <p>Geliştirici: <a href="https://www.yucelgumus.dev/" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-gray-700 transition-colors">Yücel Gümüş</a></p>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
