import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: "Becky's Hardware Store | Retail POS & Management PWA",
  description:
    'Single-store Hardware Store Management PWA for Kenyan retail with offline-first POS, unified inventory ledger, customer credit, and M-Pesa verification.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Becky's Hardware",
  },
};

export const viewport: Viewport = {
  themeColor: '#d97706',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased font-sans select-none">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
