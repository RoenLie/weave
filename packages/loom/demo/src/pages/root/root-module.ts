import { Component, Module } from '@roenlie/loom';


class RootCmp extends Component {

	public static tagName = 'lo-root';

}


export const rootModule = new Module()
	.addEntrypoint(
		() => {},
		(resolver) => RootCmp.create(resolver),
	)
	.addSegment({
		segment: () => import('./root-segments.ts').then(m => m.segment1),
	})
	.addRoutes([
		{
			pattern: '/home',
			module:  () => import('../home/home-module.ts').then(m => m.homeModule),
		},
		{
			pattern: '/settings',
			module:  () => import('../settings/settings-module.ts').then(m => m.settingsModule),
		},
	]);
