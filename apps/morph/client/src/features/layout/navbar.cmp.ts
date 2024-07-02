import { AegisElement, customElement, query, state } from '@roenlie/lit-aegis';
import { MMIcon } from '@roenlie/mimic-elements/icon';
import { type CSSResultGroup, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { sharedStyles } from '../styles/shared-styles.js';
import navbarStyles from './navbar.css' with { type: 'css' };

MMIcon.register();

@customElement('m-navbar')
export class NavbarCmp extends AegisElement {

	@query('s-nav-container') protected container: HTMLElement;
	@state() protected expanded = false;

	protected override render(): unknown {
		return html`
		<s-nav-container class=${ classMap({ active: this.expanded }) }>
			<button
				@click=${ () => {
					this.expanded = !this.expanded;
				} }
			>
				${ when(
					this.expanded,
					() => html`
					<mm-icon
						url="https://icons.getbootstrap.com/assets/icons/chevron-left.svg"
					></mm-icon>
					`,
					() => html`
					<mm-icon
						url="https://icons.getbootstrap.com/assets/icons/chevron-right.svg"
					></mm-icon>
					`,
				) }
			</button>

			<ul>
				<li>
					<span>
						<span>
							Handover
						</span>
					</span>
					<span>
						<mm-icon
							url="https://icons.getbootstrap.com/assets/icons/building.svg"
						></mm-icon>
					</span>
				</li>
				<li>
					<span>
						<span>
							Something
						</span>
					</span>
					<span>
						<mm-icon
							url="https://icons.getbootstrap.com/assets/icons/app.svg"
						></mm-icon>
					</span>
				</li>
			</ul>

		</s-nav-container>
		`;
	}

	public static override styles: CSSResultGroup = [ sharedStyles, navbarStyles ];

}
