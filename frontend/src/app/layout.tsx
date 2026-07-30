import type { Metadata } from 'next';
import { RootLayoutClient } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import '@/globals.css';

export const metadata: Metadata = {
  title: 'Elfijr - Modern Food Delivery Platform',
  description: 'Order your favorite meals from the best restaurants',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-white">
        <RootLayoutClient>
          <Header />
          <main>{children}</main>
          <Footer />
        </RootLayoutClient>
      </body>
    </html>
  );
}
