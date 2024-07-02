import { EsDialogPortalCmp, registerIconLibrary, setBasePath } from '@eyeshare/web-components';

import { MiTimekeeperCmp } from './app.cmp.js';
import { MiContentManagerCmp } from './components-pure/content/content-manager.cmp.js';

EsDialogPortalCmp;
MiContentManagerCmp;
MiTimekeeperCmp;

setBasePath('/vault/vendor/bootstrap');
registerIconLibrary('animations', {
	resolver: name => `/vault/vendor/animations/${ name }.svg`,
});
