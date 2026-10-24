import type { Metadata } from 'next';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import './globals.css';
import '@/components/atlas-identity.css';
import './landing.css';

export const metadata: Metadata = {
  title: 'Atlas — IA Agents For Education',
  description:
    'Conheça o Atlas, por NovaMente: tutores de IA, materiais de aprendizagem e referências ligadas às suas fontes.',
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
