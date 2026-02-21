import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Gemdam - House Tour Virtual",
  description: "Gemdam - House Tour Virtual - Three.js SSGI & N8A0",
  icons: {
    icon: "/logo-gemdam.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexend.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
