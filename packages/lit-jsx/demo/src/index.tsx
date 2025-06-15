import { Choose, For, Show, toJSX, toTag } from 'jsx-lit';
import { LitElement } from 'lit';
import { ifDefined } from 'lit-html/directives/if-defined.js';
import { createRef, ref } from 'lit-html/directives/ref.js';

import { ButtonElement } from './button.tsx';


class GenericTest<T> extends LitElement {

	static tagName = 'generic-test';
	static tag = toJSX(this) as <T>(p: JSX.JSXProps<GenericTest<T>>) => string;

	kakemann: T;
	items:    T[] = [];

}


export class RootElement extends LitElement {

	static tagName = 'root-element';
	static tag = toJSX(this);

	protected items: string[] = [
		'Item 1',
		'Item 2',
		'Item 3',
	];

	protected ref = createRef<HTMLElement>();

	protected override render(): unknown {
		const about = 'This is a test element';
		const ariaChecked = true;
		const ariaLabel = 'Click me!';
		const Tag = toTag('article');

		return (
			<div class={'test-class'}>

				<GenericTest.tag<string> items={this.items}>
				</GenericTest.tag>

				<Show when={this.items.length}>
					{(length) => (
						<h2>{length}</h2>
					)}
				</Show>

				<Choose>
					{[
						() => true,
						() => <span>Case 1</span>,
					]}
				</Choose>

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

				<For each={this.items}
					key={(item, index) => item + index}
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

}
