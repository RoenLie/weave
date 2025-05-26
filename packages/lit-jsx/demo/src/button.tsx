import { toJSX } from '@roenlie/lit-jsx';
import { LitElement } from 'lit';
import { when } from 'lit-html/directives/when.js';


export class ButtonElementCmp extends LitElement {

	static tagName: string = 'button-element';

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

/** This is a button element! */
export const ButtonElement = toJSX(ButtonElementCmp);


declare global {
	namespace JSX {
		interface HTMLElementTags {
			/** A custom element! */
			'button-element': HTMLAttributes<ButtonElementCmp> & {
				specialThing?: string;
			};

			'if': {
				/** A custom element! */
				condition?: boolean;
				children?:  JSX.JSXElement | JSX.JSXElement[];
			};
		}
	}
}
