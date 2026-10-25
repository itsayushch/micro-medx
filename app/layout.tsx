import type { Metadata } from "next";
import { Quicksand, Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-family-quicksand",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-family-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-family-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-family-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Micro MedX — Clinical Medication Safety Platform",
  description: "Offline Clinical Decision Support, Multi-Drug Interaction Safety, and Forensic SHA-256 Audit Ledger Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${quicksand.variable} ${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
