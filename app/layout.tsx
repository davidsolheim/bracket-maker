import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/contexts/TournamentContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bracket Magic - Tournament Bracket Manager",
  description: "Create and manage double elimination tournament brackets",
  icons: {
    icon: "/bracket-magic-icon.png",
    apple: "/bracket-magic-icon.png",
  },
  openGraph: {
    title: "Bracket Magic - Tournament Bracket Manager",
    description: "Create and manage double elimination tournament brackets",
    images: ["/bracket-magic-banner.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bracket Magic - Tournament Bracket Manager",
    description: "Create and manage double elimination tournament brackets",
    images: ["/bracket-magic-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} antialiased h-full flex flex-col`}
      >
        <ErrorBoundaryWrapper>
          <TournamentProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </TournamentProvider>
          <Toaster theme="system" richColors />
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
