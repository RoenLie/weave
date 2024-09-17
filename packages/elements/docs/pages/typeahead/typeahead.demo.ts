import { format } from '@roenlie/core/string';
import { MMTypeahead } from '@roenlie/elements/typeahead';
import { tTerm } from '@roenlie/lit-localize/directive';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { range } from 'lit/directives/range.js';

MMTypeahead.register();


declare global { interface HTMLElementTagNameMap {
	'mm-typeahead-demo': TypeaheadDemo;
} }


@customElement('mm-typeahead-demo')
export class TypeaheadDemo extends LitElement {

	protected text1 = tTerm('value.AccommodationType.BARRACK_W_COOKING');
	protected text2 = tTerm('typeahead.label', text => format(text, 'PLUM!'));

	public override render() {
		return html`
		<mm-typeahead
			openOnFocus
			openOnClick
			label=${ this.text1 }
		>
			${ map(range(200), () => html`
			<mm-typeahead-item>
				Stuff
			</mm-typeahead-item>
			`) }

			<mm-typeahead-item
				slot="action"
			>
				Do something
			</mm-typeahead-item>

			<mm-typeahead-item
				slot="action"
			>
				Do something
			</mm-typeahead-item>
		</mm-typeahead>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: block;
			height: 200px;
			aspect-ratio: 1;
		}
		.testbox {
			overflow: auto;
			height: 200px;
			aspect-ratio: 1;
			display: flex;
			flex-flow: column nowrap;
			border: 2px solid hotpink;
		}
		`,
	];

}
