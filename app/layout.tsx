import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevStash",
  description: "Your developer knowledge hub",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
