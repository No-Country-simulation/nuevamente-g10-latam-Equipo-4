import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Atlas | Workspace',
  description: 'Workspace local de aprendizagem do Atlas.',
};

export default function WorkspaceLayout({children}: {children: React.ReactNode}) {
  return children;
}
