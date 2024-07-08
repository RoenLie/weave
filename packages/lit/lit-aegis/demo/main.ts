import { css, html } from 'lit';

import { Adapter, AegisComponent, ContainerModule, customElement } from '../src/index.js';
import { sleep } from '@roenlie/core/async';


const moduleTest = async () => new ContainerModule(({ bind }) => {
	bind('kake').toConstantValue('kake2');
});


@customElement('ae-main', true)
export class MainCmp extends AegisComponent {

	constructor() {
		super(() => MainAdapter, async () => {
			await sleep(2000);

			return [ moduleTest ];
		});
	}

}


export class MainAdapter extends Adapter {

	public override connectedCallback(): void {
		console.log('adapter connected');
	}

	public override render(): unknown {
		console.log(this.container.get('kake'));

		return html`
		HELLO FROM ADAPTER
		`;
	}

	public static override styles = [
		css`
		:host {
			display: block;
			width: 200px;
			height: 100px;
			border: 2px solid red;
		}`
		,
		css`
		:host {
			border-color: blue;
		}
		`,
		(() => {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(`
			:host {
				background-color: green;
			}
			`);

			return sheet;
		})(),
	];

}
