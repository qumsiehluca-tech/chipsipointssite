import type { Metadata } from "next";
import { EB_Garamond, DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AuthGate from "./AuthGate";
import Nav from "./Nav";
import Seal from "./Seal";

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
  display: "swap"
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dmsans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Alpha Nu Tau Points | Chi Psi",
  description: "Brother point standings and history for Alpha Nu Tau of Chi Psi."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${garamond.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased min-h-screen">
        <header className="border-b border-gold/25">
          <div className="mx-auto max-w-2xl px-6 py-7 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <Seal className="w-9 h-9 text-gold/80 group-hover:text-goldBright transition-colors shrink-0" />
              <span>
                <span className="block text-[0.65rem] tracking-[0.2em] uppercase text-parchmentDim">
                  Alpha Nu Tau
                </span>
                <span className="block font-display text-xl text-parchment group-hover:text-goldBright transition-colors">
                  Chi Psi Points
                </span>
              </span>
            </Link>
            <Nav />
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-12">
          <AuthGate>{children}</AuthGate>
        </main>
        <footer className="mx-auto max-w-2xl px-6 py-10 text-[0.7rem] tracking-wide text-parchmentDim/70 border-t border-gold/10 mt-10">
          Alpha Nu Tau of Chi Psi
        </footer>
      </body>
    </html>
  );
}
