'use client';

import { Geist } from "next/font/google";
import "@/app/globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <div className={`${geistSans.variable} min-h-screen bg-gray-100`}>
        {children}
      </div>
    </SessionProvider>
  );
}
