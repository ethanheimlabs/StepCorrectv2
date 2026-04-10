import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "StepCorrect",
  description: "Clear your head. Take the next right action."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans text-foreground antialiased [&_h1]:font-serif [&_h2]:font-serif">
        {children}
      </body>
    </html>
  );
}
