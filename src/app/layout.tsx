import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rappi AI Purchasing Agent | Quick-Commerce Autonomous Supply Chain",
  description:
    "Autonomous full-stack AI purchasing agent capable of investigating inventory, evaluating multi-constraint trade-offs, executing purchase orders, and validating decisions with feedback loops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
