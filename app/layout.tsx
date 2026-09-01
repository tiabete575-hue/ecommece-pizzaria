import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../src/index.css';

export const metadata: Metadata = {
  title: "Gordeixo's Pizzaria | Forno a Lenha em Brasília",
  description: 'Pizzas artesanais, parmegianas e combos com entrega em Brasília.',
  applicationName: "Gordeixo's Pizzaria",
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
