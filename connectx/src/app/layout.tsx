import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "CONNECTX | Real-time Communication Platform",
  description:
    "Experience crystal-clear video calls, instant messaging, and AI-powered real-time translation all in one powerful platform.",
  keywords: "chat, video call, webrtc, socket.io, real-time, connectx",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
