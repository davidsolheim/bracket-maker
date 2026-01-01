import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/contexts/TournamentContext";
import { Header } from "@/components/layout/Header";
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
  title: "Bracket Maker - Tournament Bracket Manager",
  description: "Create and manage double elimination tournament brackets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ErrorBoundaryWrapper>
          <TournamentProvider>
            <Header />
            {children}
          </TournamentProvider>
          <Toaster theme="system" richColors />
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}
