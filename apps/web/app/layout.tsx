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
  title: 'Atlas — explore, pense, aprenda, evolua.',
  description:
    'Suas fontes, novas perspectivas. Um estúdio de aprendizagem com agentes educacionais e um Atlas com a sua identidade.',
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
