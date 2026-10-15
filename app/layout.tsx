import type { Metadata } from "next";
import { Geist, Geist_Mono, Sniglet, Englebert } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sniglet = Englebert({
  variable: "--font-sniglet",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Bible Quest",
  description: "Today's reading is waiting for you, do not miss it",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sniglet.variable} h-full antialiased`}
    >
      <body className="min-h-full font-snig flex flex-col">{children}</body>
    </html>
  );
}
