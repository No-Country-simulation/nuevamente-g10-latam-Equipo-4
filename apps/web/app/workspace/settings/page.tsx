import type {Metadata} from 'next';
import Connections from '@/components/connections';
import '../../studio/settings/settings.css';
export const metadata:Metadata={title:'Conexões e modelos — Atlas'};
export default function WorkspaceSettingsPage(){return <Connections studioHref="/workspace"/>;}
