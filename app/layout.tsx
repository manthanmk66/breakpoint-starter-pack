import type { Metadata, Viewport } from "next";
import { Unbounded, Figtree, DM_Mono } from "next/font/google";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Breakpoint London Starter Pack",
  description: "Walk around London and collect the 9 things every Breakpoint 2026 attendee needs.",
  openGraph: {
    title: "Breakpoint London Starter Pack",
    description: "A tiny 3D London game. Collect the 9 things every Breakpoint 2026 attendee needs.",
    type: "website",
  },
  twitter: { card: "summary_large_image", creator: "@manthan_reddy" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#E9E6DF" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
