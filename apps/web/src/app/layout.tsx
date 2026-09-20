import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PaperForge — Automated A-Level Question Bank & Worksheet Foundry',
  description:
    'Authoritative automated question-bank and Cambridge examination worksheet-generation platform for Singapore A-Level tuition teachers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=STIX+Two+Text:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-chassis text-[#dee2f1] antialiased selection:bg-primary-cyan selection:text-black">
        {children}
      </body>
    </html>
  );
}
