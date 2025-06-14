import { toJSX } from 'jsx-lit';
import { LitElement } from 'lit';
import { when } from 'lit-html/directives/when.js';


export class ButtonElement extends LitElement {

	static tagName: string = 'button-element';
	static tag = toJSX(ButtonElement);

	override connectedCallback(): void {
		super.connectedCallback();

		//this.setAttribute('special-thing', 'true');
	}

	protected override render(): unknown {
		return (
			<>
				<button on-click={() => { console.log('Button clicked!'); }}>
					<slot>CLICK ME</slot>
				</button>

				{ when(
					this.hasAttribute('special-thing'),
					() => (
						<span>
							If true!
							<span>
								Something
								{console.log('I am a special boi')}
							</span>
						</span>
					), () => (
						<span>
							If false!
						</span>
					),
				)}
			</>
		);
	}

}


declare global {
	namespace JSX {
		interface HTMLElementTags {
			/** A custom element! */
			'button-element': HTMLAttributes<ButtonElement & {
				isActive?: boolean;
			}>;
		}
	}
}
