import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';


@customElement('pl-button-demo')
export class ButtonDemoCmp extends LitElement {

	protected variants = [
		'primary',
		'primary-variant',
		'secondary',
		'tertiary',
		'neutral',
		'error',
		'elevated',
		'warning',
		'success',
		'text',
		'outline',
	];

	protected shapes = [ 'sharp', 'rounded', 'pill' ];

	protected sizes = [ 'small', 'medium', 'large' ];

	public override render() {
		return html`
		${ map(this.shapes, shape => html`
		<section>
			<pl-text>${ shape }</pl-text>
			<div class="actions">
				${ map(this.variants, variant => html`
				<div>
					<pl-text>${ variant }</pl-text>
					<pl-button variant=${ variant } shape=${ shape }>
						<pl-boot-icon icon="chevron-left" slot="prefix"></pl-boot-icon>
						<pl-text>New</pl-text>
						<pl-boot-icon icon="chevron-right" slot="suffix"></pl-boot-icon>
					</pl-button>
				</div>
				`) }
			</div>
		</section>
		`) }
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			padding-block: 12px;
			display: grid;
			gap: 12px;
		}

		section {
			display: grid;
			place-items:  center;
		}
		.actions {
			display: flex;
			flex-flow: row wrap;
			padding: 12px;
			gap: 8px;
		}
		.actions>div {
			display: grid;
			place-items: center;
			gap: 4px;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-button-demo': ButtonDemoCmp;
	}
}
