import type { Metadata } from "next";
import { Rajdhani, Chakra_Petch, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/contexts/TournamentContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "sonner";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { JsonLd } from "@/components/seo/JsonLd";
import { getWebApplicationSchema, getOrganizationSchema } from "@/lib/structured-data";

const rajdhani = Rajdhani({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const chakraPetch = Chakra_Petch({
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
  metadataBase: new URL("https://www.bracket-magic.com"),
  title: {
    default: "Bracket Magic - Tournament Bracket Manager",
    template: "%s | Bracket Magic",
  },
  description: "Create and manage professional tournament brackets with ease. Supports double elimination, round robin, Swiss system, and more.",
  keywords: ["tournament manager", "bracket maker", "double elimination", "round robin", "swiss system", "esports tournament", "bumper pool brackets"],
  authors: [{ name: "David Solheim", url: "https://davidsolheim.com" }],
  creator: "David Solheim",
  icons: {
    icon: "/bracket-magic-icon.png",
    apple: "/bracket-magic-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.bracket-magic.com",
    siteName: "Bracket Magic",
    title: "Bracket Magic - Tournament Bracket Manager",
    description: "Create and manage professional tournament brackets. Supports double elimination, round robin, Swiss system, and group stages.",
    images: [
      {
        url: "/bracket-magic-banner-white.png",
        width: 1200,
        height: 630,
        alt: "Bracket Magic Tournament Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bracket Magic - Tournament Bracket Manager",
    description: "Create and manage professional tournament brackets with ease.",
    images: ["/bracket-magic-banner-white.png"],
    creator: "@davidsolheim",
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <JsonLd data={getWebApplicationSchema()} />
        <JsonLd data={getOrganizationSchema()} />
      </head>
      <body
        className={`${rajdhani.variable} ${chakraPetch.variable} ${jetbrainsMono.variable} antialiased h-full flex flex-col`}
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
