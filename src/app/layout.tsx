import type { Metadata } from "next";
import { Inter } from "next/font/google"; // <--- Usiamo Google Fonts (Zero file locali)
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Configurazione Font Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SGIC - Audit Management",
  description: "ISO 9001 Audit System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${inter.className} antialiased`}>
        {children}
        {/* Il Toaster per le notifiche */}
        <Toaster />
      </body>
    </html>
  );
}