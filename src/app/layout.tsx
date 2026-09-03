import type {Metadata} from 'next';
import { Inter, Dancing_Script } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
  variable: '--font-dancing-script',
});

export const metadata: Metadata = {
  title: 'DiaCero - Plataforma de aprendizaje',
  description: 'Plataforma de aprendizaje',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${dancingScript.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
