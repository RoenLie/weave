import '@roenlie/mirage-mde';

import { testDoc } from './doc-example.js';

const mde = document.createElement('mirage-mde');
mde.options = {
	initialValue: testDoc,
};

const wrapperEl = document.querySelector('.wrapper');
wrapperEl?.appendChild(mde);
