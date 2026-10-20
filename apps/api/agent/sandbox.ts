import { defineSandbox } from 'eve/sandbox';
import { JustBashSandbox } from 'eve/sandbox/just-bash';
// No native processes or host mounts; default execution/file tools remain disabled.
export const environment = JustBashSandbox.environment({autoInstall:false});
export default defineSandbox(() => environment.open());
