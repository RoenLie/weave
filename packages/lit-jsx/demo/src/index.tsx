import { LitElement } from 'lit';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { join } from 'lit-html/directives/join.js';
import { map } from 'lit-html/directives/map.js';
import { createRef, ref } from 'lit-html/directives/ref.js';
import { repeat } from 'lit-html/directives/repeat.js';

import { toTag } from '../../dist/utils';
import { ButtonElement } from './button.tsx';


function For<T, U extends JSX.Element>(props: {
	each:       readonly T[];
	key?:       (item: T, index: number) => any;
	separator?: JSX.Element;
	children:   (item: T, index: number) => U;
}): () => U[] {
	let iter: any;

	if (props.key) {
		iter = repeat(
			props.each,
			(item, index) => props.key!(item, index),
			(item, index) => props.children(item, index),
		) as any;
	}
	else {
		iter = map(
			props.each,
			(item, index) => props.children(item, index),
		) as any;
	}

	if (props.separator)
		iter = join(iter, props.separator) as any;

	return iter;
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

		const Tag = toTag('article');

		return (
			<div class={'test-class'}>
				<Tag.tag></Tag.tag>

				<ButtonElement.tag
					about       ={as.prop(about)}
					aria-checked={as.bool(ariaChecked)}
					aria-label  ={ifDefined(ariaLabel)}
					directive   ={ref(this.ref)}
				></ButtonElement.tag>

				<ButtonElement.tag
					about       ={prop => about}
					aria-checked={bool => ariaChecked}
					directive   ={[ ref(this.ref) ]}
				></ButtonElement.tag>

				<For
					each={this.items}
					key={item => item}
					separator={<span>|</span>}
				>
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
