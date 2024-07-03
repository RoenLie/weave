import { emitEvent } from '@roenlie/core/dom';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import { component } from '../../src/core/component.js';
import { useAfterConnected } from '../../src/hooks/use-after-connected.js';
import { useConnected } from '../../src/hooks/use-connected.js';
import { useController } from '../../src/hooks/use-controller.js';
import { useDisconnected } from '../../src/hooks/use-disconnected.js';
import { useOnEvent } from '../../src/hooks/use-onevent.js';
import { useProperty, useState } from '../../src/hooks/use-property.js';
import { useQuery } from '../../src/hooks/use-query.js';
import { useUpdated } from '../../src/hooks/use-updated.js';


@customElement('demo-introduction')
export class DemoIntroduction extends LitElement {

	@state() protected toggle = true;

	protected override render() {
		return html`
		<button @click=${ () => this.toggle = !this.toggle }>Toggle</button>
		${ cache(this.toggle ? html`
		<demo-button label="from outside"></demo-button>
		` : nothing) }
		`;
	}

	public static override styles = [
		css`
		:host {
			display: grid;
			grid-auto-rows: max-content;
		}
		`,
	];

}

declare global {
	interface HTMLElementTagNameMap {
		'demo-button': DemoButton;
	}
}

declare class DemoButton extends LitElement {

	public label: string;

}

export type { DemoButton };


component('demo-button', (element) => {
	const [ label, setLabel ] = useProperty('label', 'test-label', { type: String });
	const [ counter, setCounter ] = useState('counter', 0, { type: Number });
	const subCounter = 0;
	const inputQry = useQuery('inputQry', 'input');

	useConnected(() => {
		//console.log('connected');
	});

	useDisconnected(() => {
		//console.log('disconnecting');
	});

	useAfterConnected(() => {
		//console.log('after connected!', inputQry.value);
	});

	useUpdated((props) => {
		//console.log('effect!', props);
	}, [ 'counter' ]);

	useController({
		hostUpdate() {
			//console.log('controller updating');
		},
		hostConnected() {
			//console.log('host connected');
		},
		hostDisconnected() {
			//console.log('controller disconnecting');
		},
	});

	return ({
		render: () => html`
		<button @click=${ () => {
			setCounter(counter.value + 1);
			emitEvent(element, 'stuff');
		} }>
			${ label?.value } ${ counter.value } ${ subCounter }
		</button>

		<input @input=${ (ev: InputEvent) =>
			setLabel((ev.target as any).value) } />
		`,
		styles: css`
		button {
			background-color: hotpink;
			width: 200px;
			height: 100px;
		}
		`,
	});
}).register();
