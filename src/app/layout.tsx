import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectFlow — MEP Project Portal",
  description: "White-label SaaS platform for MEP engineering firms",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
