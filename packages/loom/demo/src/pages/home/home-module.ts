import { Component, Module } from '@roenlie/loom';


class HomeCmp extends Component {

	public static tagName = 'lo-home';

}


export const homeModule = new Module('home')
	.addEntrypoint(
		() => {},
		resolver => HomeCmp.create(resolver),
	)
	.addSegment({
		scope:   'home',
		order:   100,
		segment: () => import('./home-segments.ts').then(m => m.segment1),
	});
