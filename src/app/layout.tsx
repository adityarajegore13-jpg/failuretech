import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FailureTech Client Portal | Engineering & Agency Hub",
  description:
    "Enterprise client dashboard for real-time project metrics, transparent milestones, ticket escalation, and billing.",
  keywords: [
    "FailureTech",
    "Client Portal",
    "Agency Dashboard",
    "Project Management",
    "Supabase",
    "Next.js",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#070a12] text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
