import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMART OfferFlow",
  description: "Angebote, Aufträge und Abrechnung in einem Prozess"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
