import type {Metadata} from 'next';
import localFont from 'next/font/local';
import { Dancing_Script } from 'next/font/google';
import './globals.css';

const teachers = localFont({
  src: [
    {
      path: '../../public/fonts/teachers-latin.woff2',
      weight: '400 800',
      style: 'normal',
    },
    {
      path: '../../public/fonts/teachers-latin-italic.woff2',
      weight: '400 800',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-teachers',
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
    <html lang="es" className={`${teachers.variable} ${dancingScript.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Teachers:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
