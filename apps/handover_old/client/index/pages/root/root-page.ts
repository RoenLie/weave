import { AppElement, customElement } from '@roenlie/sanguine';
import { Router } from '@roenlie/sanguine/router';
import { css, html } from 'lit';
import { TopNavCmp } from './top-nav.cmp.ts';

TopNavCmp.register();


@customElement('ho-root-page')
export class RootPageCmp extends AppElement {

	protected router = new Router(this, [
		{
			path:  '/',
			enter: () => {
				return location.replace('/home'), false;
			},
		},
		{
			path:  '/home{/*}?',
			enter: async () => {
				(await import('../home/home-page.ts')).HomePageCmp.register();

				return true;
			},
			render: () => html`<ho-home-page></ho-home-page>`,
		},
		{
			path:  '/settings{/*}?',
			enter: async () => {
				(await import('../settings/settings-page.ts')).SettingsPageCmp.register();

				return true;
			},
			render: () => html`<ho-settings-page></ho-settings-page>`,
		},
	]);

	protected override render(): unknown {
		return html`
		<ho-top-nav></ho-top-nav>
		${ this.router.outlet() }
		`;
	}

	public static override styles = css`
	:host {
		contain: strict;
		display: grid;
		grid-template-rows: max-content auto;
	}
	`;

}
