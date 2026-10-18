import type { Metadata } from 'next';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import './globals.css';
export const metadata: Metadata = {title: 'NovaMente Atlas — seu estúdio de aprendizagem', description: 'Transforme suas fontes em aprendizagem, com cinco tutores e evidências à mão.'};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="pt-BR"><body>{children}</body></html>;}
