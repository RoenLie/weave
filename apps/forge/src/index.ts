import './app/identifiers.js';

import { initializeStyleTokens } from '@roenlie/mimic-elements/styles';
import { Router } from '@vaadin/router';
import { render } from 'lit';

import { routes } from './features/routes/routes.js';


initializeStyleTokens();


const router = new Router();
const routerEl = document.createElement('s-router');
routerEl.style.setProperty('display', 'contents');

router.setOutlet(routerEl);
router.setRoutes(routes);

Object.assign(window, {
	router,
});


declare global {
	// eslint-disable-next-line no-var
	var router: Router;
}


render(routerEl, document.body);
