import type { Metadata, Viewport } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PwaClient } from "@/app/pwa-client";

export const metadata: Metadata = {
  title: "Ledger",
  description: "个人日常记账应用",
  applicationName: "Ledger",
  appleWebApp: {
    capable: true,
    title: "Ledger",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/icons/ledger-icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        url: "/icons/ledger-icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
    apple: "/icons/ledger-icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#26251e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={cn("h-full antialiased", "font-sans")}>
      <body className="min-h-full flex flex-col">
        <PwaClient />
        {children}
      </body>
    </html>
  );
}
