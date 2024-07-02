import { AppRouterCmp } from '@roenlie/mimic-elements/router';
import type { Route } from '@vaadin/router';
import { html, render } from 'lit';

import { LayoutPageCmp } from '../../pages/layout/layout.cmp.js';

// We cache the layout, as we don't want to reinitialize it.
let layoutCmp: HTMLElement | undefined = undefined;

export const routes: Route[] = [
	{
		name:   'layout',
		path:   '/',
		action: async () => {
			if (layoutCmp)
				return layoutCmp;

			(await import('../../pages/layout/layout.cmp.js')).LayoutPageCmp.register();
			layoutCmp = document.createElement(LayoutPageCmp.tagName);

			return layoutCmp;
		},
		children: [
			{ path: '', redirect: '/forge' },
			{
				name:   'forge',
				path:   '/forge',
				action: async (ctx) => {
					await import('../../pages/forge/forge-module.js');

					return AppRouterCmp.routeComponent(
						() => import('../../pages/forge/forge.cmp.js'),
					)(ctx);
				},
			},
			{
				name:   'diary',
				path:   '/diary',
				action: async () => {
					const div = document.createElement('div');

					const cmp = (await import('../../pages/diary/diary-page.cmp.js')).DiaryPage;
					render(cmp({}), div);

					return div.firstElementChild as HTMLElement;
				},
			},
			{
				name:   'settings',
				path:   '/settings',
				action: AppRouterCmp.routeComponent(
					() => import('../../pages/settings/settings.cmp.js'),
				),
			},
		],
	},
];
