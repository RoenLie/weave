import { Route } from '@roenlie/lit-router';

import { routeAnimation } from '../../app/routes/route-animation.js';


export const demoRoutes: Route[] = [
	{
		name:      'button',
		path:      '/button',
		component: 'pl-button-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/button/button-demo.cmp.js'); },
	},
	{
		name:      'icon button',
		path:      '/icon-button',
		component: 'pl-icon-button-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/button/icon-button-demo.cmp.js'); },
	},
	{
		name:      'input',
		path:      '/input',
		component: 'pl-input-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/input/input-demo.cmp.js'); },
	},
	{
		name:      'list',
		path:      '/list',
		component: 'pl-list-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/list/list-demo.cmp.js'); },
	},
	{
		name:      'progress',
		path:      '/progress',
		component: 'pl-progress-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/progress/progress-demo.cmp.js'); },
	},
	{
		name:      'spinner',
		path:      '/spinner',
		component: 'pl-spinner-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/spinner/spinner-demo.cmp.js'); },
	},
	{
		name:      'dialog',
		path:      '/dialog',
		component: 'pl-dialog-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/dialog/dialog-demo.js'); },
	},
	{
		name:      'alert',
		path:      '/alert',
		component: 'pl-alert-demo',
		animation: routeAnimation(),
		action:    () => { import('../../components/alert/alert-demo.js'); },
	},
];
