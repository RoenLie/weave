import { setDefaultAnimation } from '@roenlie/core/animation';
import { Route } from '@roenlie/lit-router';

import { routeAnimation } from './route-animation.js';


export const generateRoutes = (): Route[] => {
	return [
		{
			path:      '',
			component: 'pl-layout-page',
			action:    () => { import('../../pages/layout/layout-page.cmp.js'); },
			animation: routeAnimation(),
			redirect:  '/home',
			children:  [
				{
					path:      '/home',
					component: 'pl-home-page',
					action:    () => { import('../../pages/home/home-page.cmp.js'); },
					animation: routeAnimation(),
				},
				{
					path:      '/calendar',
					component: 'pl-calendar-page',
					action:    () => { import('../../pages/calendar/calendar-page.cmp.js'); },
					animation: routeAnimation(),
				},
				{
					path:      'settings',
					component: 'pl-settings-page',
					action:    () => { import('../../pages/settings/settings-page.cmp.js'); },
					animation: routeAnimation(),
					redirect:  '/settings/users',
					children:  () => import('../../pages/settings/user-routes.js').then(m => m.userRoutes),
				},
				{
					path:      'reports',
					component: 'pl-reports-page',
					action:    () => { import('../../pages/reports/reports-page.cmp.js'); },
					animation: routeAnimation(),
				},
				{
					path:      'profile',
					component: 'pl-profile-page',
					action:    () => { import('../../pages/profile/profile-page.cmp.js'); },
					animation: routeAnimation(),
				},
				{
					path:      'demo',
					component: 'pl-demo-page',
					action:    () => { import('../../pages/demo/demo-page.cmp.js'); },
					animation: routeAnimation(),
					redirect:  '/demo/button',
					children:  () => import('../../pages/demo/demo-routes.js').then(m => m.demoRoutes),
				},
			],
		},
		{ path: '/not-found', component: 'div' },
		{ path: '(.*)', redirect: '/not-found' },
	];
};


setDefaultAnimation('route.show', {
	keyframes: [
		{ opacity: 0 },
		{ opacity: 1 },
	],
	options: { duration: 200, easing: 'ease-out' },
});

setDefaultAnimation('route.hide', {
	keyframes: [
		{ opacity: 1 },
		{ opacity: 0 },
	],
	options: { duration: 200, easing: 'ease-in' },
});
