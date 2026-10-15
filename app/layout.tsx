import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Englebert } from "next/font/google";
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
  title: "Bible in a Year",
  applicationName: "Bible in a Year",
  appleWebApp: {
    capable: true,
    title: "Bible",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets you use env(safe-area-inset-*) for notched phones
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
