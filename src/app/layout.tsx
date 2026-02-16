import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://www.binevo.ro";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Binevo - Platforma CRM si Campanii pentru ONG-uri",
  description: "Gestionare completa a donatorilor, campanii cu AI si automatizari pentru ONG-uri",
  openGraph: {
    title: "Binevo - Platforma CRM si Campanii pentru ONG-uri",
    description: "Gestionare completa a donatorilor, campanii cu AI si automatizari pentru ONG-uri",
    type: "website",
    siteName: "Binevo",
    images: [{ url: "/api/og?title=Binevo&subtitle=Platforma CRM si Campanii pentru ONG-uri", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Binevo - Platforma CRM si Campanii pentru ONG-uri",
    description: "Gestionare completa a donatorilor, campanii cu AI si automatizari pentru ONG-uri",
    images: ["/api/og?title=Binevo&subtitle=Platforma CRM si Campanii pentru ONG-uri"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
