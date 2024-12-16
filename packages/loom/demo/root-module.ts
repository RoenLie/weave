import { Component, Module } from '@roenlie/loom';
import { segment1 } from './root-segments.ts';


class RootCmp extends Component {

	public static tagName = 'lo-root';

}


export const rootModule = new Module()
	.addEntrypoint(
		() => {},
		(resolver) => RootCmp.create(resolver),
	).addSegment(async () => segment1);
