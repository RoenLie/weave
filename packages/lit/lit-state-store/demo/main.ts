import { range } from '@roenlie/core/array';
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { StateStore } from '../src/store.js';


class TestStore extends StateStore {

	public counter = { value: 0 };

}

const testStore = new TestStore();
(globalThis as any)['testStore'] = testStore;


@customElement('demo-main')
export class MainCmp extends LitElement {

	@state() protected counters: HTMLElement[] = range(0, 500)
		.map(() => document.createElement('demo-counter'));

	protected counterInterval?: ReturnType<typeof setInterval>;
	protected templateInterval?: ReturnType<typeof setInterval>;

	public override connectedCallback(): void {
		super.connectedCallback();

		this.counterInterval = setInterval(() => {
			testStore.update('counter', (value) => {
				value.value++;
			});
		}, 10);

		this.templateInterval = setInterval(() => {
			this.counters = range(0, 500)
				.map(() => document.createElement('demo-counter'));

			testStore.counter.value = 0;
		}, 5000);
	}

	protected override render() {
		return html`
		${ map(this.counters, counter => counter) }
		`;
	}

	public static override styles = [
		css`
		:host {
			display: grid;
			grid-template-columns: repeat(25, 30px);
			grid-auto-rows: 30px;
		}
		`,
	];

}


@customElement('demo-counter')
export class CounterCmp extends LitElement {

	protected func() {}

	public override connectedCallback(): void {
		super.connectedCallback();
		testStore.connect(this, 'counter');
		testStore.listen(this, 'counter', this.func.bind(this), { priority: 100 });
	}

	protected override render() {
		const fontSize = Math.ceil(Math.random() * 16) + 'px';
		const r = Math.ceil(Math.random() * 255);
		const g = Math.ceil(Math.random() * 255);
		const b = Math.ceil(Math.random() * 255);
		const bg = `rgb(${ r } ${ g } ${ b })`;

		return html`
		<div style=${ styleMap({
			'background-color': bg,
			'font-size':        fontSize,
		}) }>
			${ testStore.counter.value }
		</div>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: grid;
		}
		div {
			display: grid;
			place-items: center;
		}
		`,
	];

}
