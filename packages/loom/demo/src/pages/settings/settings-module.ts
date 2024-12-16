import { Component, Module } from '@roenlie/loom';


class SettingsCmp extends Component {

	public static tagName = 'lo-settings';

}


export const settingsModule = new Module('settings')
	.addEntrypoint(
		() => {},
		resolver => SettingsCmp.create(resolver),
	)
	.addSegment({
		scope:   'settings',
		order:   100,
		segment: () => import('./settings-segments.ts').then(m => m.segment1),
	});
