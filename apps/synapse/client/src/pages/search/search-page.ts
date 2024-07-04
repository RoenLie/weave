import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import searchPageStyles from './search.css' with { type: 'css' };
import { sharedStyles } from '../../app/shared-styles.ts';


@customElement('syn-search-page')
export class SearchPageCmp extends LitElement {


	public override connectedCallback(): void {
		super.connectedCallback();

		this.updateComplete.then(() => {
			this.shadowRoot!.querySelector('input')?.focus();
		});
	}

	protected override render(): unknown {
		return html`
		<s-results>

		</s-results>
		<s-search>
			<input synapse type="search" label="kake">
		</s-search>
		`;
	}

	public static override styles = [
		sharedStyles,
		searchPageStyles,
	];

}
