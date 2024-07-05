import { type ButtonShape, type ButtonSize, type ButtonVariant, MMButton } from '@roenlie/elements/button';
import { MMIcon } from '@roenlie/elements/icon';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

MMButton.register();
MMIcon.register();


@customElement('mm-button-demo')
export class ButtonDemo extends LitElement {

	protected variants: ButtonVariant[] = [
		'primary',
		'variant',
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

	protected shapes: ButtonShape[] = [ 'sharp', 'rounded', 'pill' ];

	protected sizes: ButtonSize[] = [ 'x-small', 'small', 'medium', 'large', 'x-large' ];

	public override render() {
		return html`
		${ map(this.shapes, shape => html`
		<section>
			<span>${ shape }</span>

			<div class="actions">
				${ map(this.variants, variant => html`
				<div>
					<span>${ variant }</span>
					${ map(this.sizes, size => html`
					<mm-button variant=${ variant } shape=${ shape } size=${ size }>
						<mm-icon
							slot="prefix"
							url="https://icons.getbootstrap.com/assets/icons/chevron-left.svg"
						></mm-icon>
						<span>New</span>
						<mm-icon
							slot="suffix"
							url="https://icons.getbootstrap.com/assets/icons/chevron-right.svg"
						></mm-icon>
					</mm-button>
					`) }
				</div>
				`) }
			</div>
		</section>
		`) }
		`;
	}

	public static override styles = [
		sharedStyles,
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
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			gap: 4px;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-button-demo': ButtonDemo;
	}
}
