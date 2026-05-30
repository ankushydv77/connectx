import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ConnectX - Premium Video Meetings & Real-Time Collaboration",
  description: "ConnectX provides high-quality video meetings, real-time translations, and interactive collaboration features.",
  keywords: "connectx, video call, meeting, translation, real-time collaboration, next.js",
};

import LayoutWrapper from "./components/LayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
