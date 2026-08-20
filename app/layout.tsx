import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
;

export const metadata: Metadata = {
  title: "DevStash",
  description: "Your developer knowledge hub",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children} <Toaster position="top-right" />
      </body>
    </html>
  );
}
