import { getAnimation, setDefaultAnimation } from '@roenlie/core/animation';

export const generateRoutes = (el: Element) => {
	return [
		{
			path:      '',
			component: 'ha-layout',
			action:    async () => {
				await import('./layout.cmp.js');
			},
			children: [
				{
					name:      'firstPage',
					path:      '/',
					component: 'ha-route1',
					animation: {
						show: getAnimation(el, 'route.show'),
						hide: getAnimation(el, 'route.hide'),
					},
					action: async () => {
						await import('./route1.cmp.js');
					},
				},
				{
					name:      'editor',
					path:      'route2',
					component: 'ha-route2',
					animation: {
						show: getAnimation(el, 'route.show'),
						hide: getAnimation(el, 'route.hide'),
					},
					action: async () => {
						await import('./route2.cmp.js');
					},
				},
			],
		},
		{
			path:     '(.*)',
			redirect: '',
		},
	];
};


setDefaultAnimation('route.show', {
	keyframes: [
		{ opacity: 0 },
		{ opacity: 1 },
	],
	options: { duration: 200, easing: 'linear' },
});

setDefaultAnimation('route.hide', {
	keyframes: [
		{ opacity: 1 },
		{ opacity: 0 },
	],
	options: { duration: 200, easing: 'linear' },
});
