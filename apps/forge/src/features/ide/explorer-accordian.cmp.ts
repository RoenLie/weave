import { AegisElement, customElement } from '@roenlie/lit-aegis';
import { emitEvent } from '@roenlie/core/dom';
import { tooltip } from '@roenlie/elements/tooltip';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import exaccordianStyles from './explorer-accordian.css' with { type: 'css' };


export interface AccordianAction {
	label: string;
	icon: string;
	action: () => void;
}


/**
 * @emits input-focusout - Emitted when a editing input field loses focus.
 */
@customElement('m-explorer-accordian', true)
export class ExplorerAccordianCmp extends AegisElement {

	@property({ type: Boolean, reflect: true }) public expanded?: boolean;
	@property({ type: String }) public header?: string;
	@property({ type: Array }) public actions?: AccordianAction[];

	protected renderHeader(text: string) {
		return html`
		<s-accordian-header @click=${ () => {
			emitEvent(this, this.expanded ? 'collapse' : 'expand');
		} }>
			<mm-icon
				style="font-size:18px;"
				url=${ this.expanded
					? 'https://icons.getbootstrap.com/assets/icons/chevron-down.svg'
					: 'https://icons.getbootstrap.com/assets/icons/chevron-right.svg' }
			></mm-icon>
			<span>
				${ text }
			</span>
			<s-actions>
				${ map(this.expanded ? this.actions ?? [] : [], def => {
					return html`
					<mm-button
						${ tooltip(def.label) }
						type="icon"
						variant="text"
						size="small"
						shape="rounded"
						@click=${ (ev: Event) => {
							ev.stopPropagation();
							def.action();
						} }
					>
						<mm-icon
							style="font-size:18px;"
							url=${ def.icon }
						></mm-icon>
					</mm-button>
					`;
				}) }
			</s-actions>
		</s-accordian-header>
		`;
	}

	protected override render(): unknown {
		return html`
		<s-accordian>
			${ this.renderHeader(this.header ?? '') }
			<s-slot-wrapper>
				<slot></slot>
			</s-slot-wrapper>
		</s-accordian>
		`;
	}

	public static override styles = [ sharedStyles, exaccordianStyles ];

}


declare global {
	interface HTMLElementTagNameMap {
		'm-exaccordian': ExplorerAccordianCmp;
	}
}
