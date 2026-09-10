import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { getSessionRole } from "@/lib/data";
import LogoutButton from "./LogoutButton";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
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
  const role = getSessionRole();

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body antialiased min-h-screen">
        <header className="border-b border-gold/20">
          <div className="mx-auto max-w-3xl px-6 py-8 flex items-baseline justify-between">
            <a href="/" className="group">
              <p className="text-xs tracking-wide text-parchmentDim">Alpha Nu Tau</p>
              <h1 className="font-display text-2xl text-parchment group-hover:text-goldBright transition-colors">
                Chi Psi Points
              </h1>
            </a>
            <div className="flex items-center gap-6">
              {role === "admin" && (
                <a
                  href="/admin"
                  className="text-sm text-purpleLight hover:text-goldBright transition-colors"
                >
                  Log points
                </a>
              )}
              {role && <LogoutButton />}
              <p className="font-display italic text-gold text-sm">Founded 1841</p>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-3xl px-6 py-10 text-xs text-parchmentDim border-t border-gold/10 mt-10">
          Alpha Nu Tau of Chi Psi &middot; retroactively effective 8/21/26
        </footer>
      </body>
    </html>
  );
}
