import { registerIconLibrary, setBasePath } from '@eyeshare/web-components';

import { MiChessDimensionCmp } from './components-app/app/app.cmp.js';

MiChessDimensionCmp;

setBasePath('/vault/vendor/bootstrap');
registerIconLibrary('animations', {
	resolver: name => `/vault/vendor/animations/${ name }.svg`,
});
registerIconLibrary('chess', {
	resolver: name => `/chesspieces/${ name }.svg`,
});
