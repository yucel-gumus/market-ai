import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import QueryProvider from "@/providers/QueryProvider";
import Navbar from "@/components/Navbar";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MarketAI - Akıllı Market & Ürün Arama Platformu",
  description: "Yakınınızdaki marketleri ve en uygun ürün fiyatlarını bulun; tarifinizin malzemelerini AI ile seçip tek sepette toplayın.",
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
        className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased bg-[#EDF3EE] text-[#253341] min-h-screen flex flex-col`}
      >
        <QueryProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer className="w-full py-3 text-center text-xs text-[#3E5164] bg-[#DBE6DD]/60 border-t border-[#BCC7D2]">
            <p>Geliştirici: <a href="https://www.yucelgumus.dev/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#253341] underline hover:text-[#AB421C] transition-colors">Yücel Gümüş</a></p>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
