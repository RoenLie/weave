import { AppRouterCmp } from '@roenlie/mimic-elements/router';
import type { Route } from '@vaadin/router';

export const routes: Route[] = [
	{
		name: 'root',
		path: '/',
		action: AppRouterCmp.routeComponent(
			() => import('../layout/layout.cmp.js'),
		),
		children: [
			{ path: '/', redirect: '/handover' },
			{
				path: '/handover',
				action: AppRouterCmp.routeComponent(
					() => import('../../pages/handover/handover-page.js'),
				),
			},
		],
	},
];
