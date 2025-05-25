import { toJSX } from '@roenlie/lit-jsx';
import { LitElement } from 'lit';


export class ButtonElementCmp extends LitElement {

	static tagName: string = 'button-element';

	protected override render(): unknown {
		return (
			<button on-click={() => { console.log('Button clicked!'); }}>
				<slot>CLICK ME</slot>
			</button>
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
		}
	}
}
