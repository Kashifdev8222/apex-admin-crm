import { DM_Sans, Fraunces } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Apex Admin CRM",
  description: "Multi-tenant ClientZone operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable} antialiased`} style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
