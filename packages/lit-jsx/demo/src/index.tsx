import { LitElement } from 'lit';

import { ButtonElement } from './button.tsx';


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

	protected render1(): unknown {
		return (
			<div class={'test-class'}>
				<ButtonElement></ButtonElement>

				<For each={this.items} fallback={<span>Loading...</span>}>
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
