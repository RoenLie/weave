import { InjectableElement, injectableElement } from '@roenlie/lit-utilities/injectable';
import { css, html } from 'lit';
import { state } from 'lit/decorators.js';
import { map } from	 'lit/directives/map.js';

import { router } from '../../app/routes/router.js';
import { componentStyles } from '../../features/shared-styles/component-styles.js';


@injectableElement(
	'pl-settings-page',
)
export class SettingsPageCmp extends InjectableElement {

	@state() protected activeLink = '';

	protected items = [
		{
			icon: 'people',
			text: 'users',
			href: '/settings/users',
		},
		{
			icon: 'person-workspace',
			text: 'shifts',
			href: '/settings/shifts',
		},
	];

	public override connectedCallback(): void {
		super.connectedCallback();

		window.addEventListener('popstate', this.handlePopstate);
		this.handlePopstate();
	}

	public override disconnectedCallback(): void {
		super.connectedCallback();
		window.removeEventListener('popstate', this.handlePopstate);
	}

	protected handlePopstate = () => {
		const path = location.pathname;
		this.activeLink = path;
	};

	public override render() {
		return html`
		<pl-sub-nav>
			${ map(this.items, item => html`
			<pl-sub-nav-item
				role="link"
				@click=${ () => router.navigate(item.href) }
				?active=${ this.activeLink.includes(item.href) }
			>
				<pl-boot-icon slot="icon" icon=${ item.icon }></pl-boot-icon>
				<pl-text shadow>${ item.text }</pl-text>
			</pl-sub-nav-item>
			`) }
		</pl-sub-nav>

		<main>
			<slot></slot>
		</main>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			height: 100%;
			display: grid;
			grid-template-columns: 150px 1fr;
			grid-template-rows: 1fr;
			overflow: hidden;
		}
		:host>:first-child {
			overflow: auto;
			border-right: 1px solid var(--outline-variant);
		}
		:host>:last-child {
			overflow: auto;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-settings-page': SettingsPageCmp;
	}
}
