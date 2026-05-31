import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutureSelf - Daily Health Decisions",
  description:
    "Compare short-term habit choices using transparent survey-based scores for energy, mood, and focus.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-text-primary antialiased min-h-screen flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-background flex flex-col relative shadow-sm border-x border-border/40">
          {children}
        </div>
      </body>
    </html>
  );
}
