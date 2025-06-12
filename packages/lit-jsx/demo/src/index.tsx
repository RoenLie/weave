import { LitElement } from 'lit';
import type { Directive as kake1, Directive as kake2, DirectiveResult } from 'lit-html/directive.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { createRef, ref } from 'lit-html/directives/ref.js';

import { ButtonElement_ } from './button.tsx';


function For<T, U extends JSX.Element>(props: {
	each:      readonly T[];
	fallback?: JSX.Element;
	children:  (item: T, index: number) => U;
}): () => U[] {
	return undefined as any;
}


export class RootElement extends LitElement {

	protected items: string[] = [
		'Item 1',
		'Item 2',
		'Item 3',
	];

	protected ref = createRef<HTMLElement>();

	protected render1(): unknown {
		const about = 'This is a test element';
		const ariaChecked = true;
		const ariaLabel = 'Click me!';

		return (
			<div class={'test-class'}>
				<ButtonElement_
					about       ={as.prop(about)}
					aria-checked={as.bool(ariaChecked)}
					directive   ={ref(this.ref)}
				></ButtonElement_>

				<ButtonElement_
					about       ={prop => about}
					aria-checked={bool => ariaChecked}
					directive   ={[ ref(this.ref) ]}
				></ButtonElement_>

				<For each={this.items}>
					{(item, index) => (
						<div class="item" data-key={index}>
							{item}
						</div>
					)}
				</For>
			</div>
		);
	}


	//protected immediateRender(): unknown {
	//	return (
	//		<div class="first-element">
	//			<h1>Lit JSX Demo</h1>
	//			<p>{'dynamic content goes here'}</p>
	//			<span>{(<s-inner-span></s-inner-span>)}</span>
	//		</div>
	//	);
	//}

	//protected variableRender(): unknown {
	//const jsx = (
	//	<div class="first-element">
	//		<h1>Lit JSX Demo</h1>
	//		<p>{'dynamic content goes here'}</p>
	//		<span>{(<s-inner-span></s-inner-span>)}</span>
	//	</div>
	//);

	//return jsx;
	//}


	static { customElements.define('root-element', this); }

}
