import Atlas from '@/components/atlas';
import {redirectWithoutSession} from '@/lib/server/session';

export default async function WorkspacePage() {
  await redirectWithoutSession();
  return <Atlas />;
}
