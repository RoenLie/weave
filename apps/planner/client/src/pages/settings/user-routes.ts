
import { Route } from '@roenlie/lit-router';

import { routeAnimation } from '../../app/routes/route-animation.js';


export const userRoutes: Route[] = [
	{
		name:      'shift-list',
		path:      '/shifts',
		component: 'pl-shift-list',
		animation: routeAnimation(),
		action:    () => { import('./shifts/shift-list.cmp.js'); },
	},
	{
		name:      'user-list',
		path:      '/users',
		component: 'pl-user-list',
		animation: routeAnimation(),
		action:    () => { import('./users/user-list.cmp.js'); },
		children:  [ { path: '/:id' } ],
	},
];
