import './modules-sidebar.cmp.ts';
import './modules-form.cmp.ts';

import { SignalWatcher } from '@lit-labs/preact-signals';
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { type IModule, Module } from '../../../../models/modules-model.ts';
import type { MResponse } from '../../../../models/response.ts';
import { ModulesStore } from './modules-store.ts';


@customElement('m-modules-root')
export class ModulesRoot extends SignalWatcher(LitElement) {

	@state() protected store = new ModulesStore();

	public override connectedCallback() {
		super.connectedCallback();
		this.loadItems();
	}

	protected onReloadItems() {
		this.loadItems();
	}

	protected onNewItem() {
		this.store.selectedModule.value = Module.initialize({
			active:      0,
			code:        '',
			description: '',
			name:        '',
			namespace:   '',
		});
	}

	protected async loadItems() {
		const response = await fetch('/api/modules/all');
		const json: MResponse<IModule[]> = await response.json();

		this.store.modules.value = json.data ?? [];
	}

	protected override render() {
		return html`
		<aside>
			<button @click=${ this.onNewItem }>
				New
			</button>
			<m-modules-sidebar
				.store=${ this.store }
			></m-modules-sidebar>
		</aside>
		<main>
			<m-modules-form
				.store=${ this.store }
				@reload-items=${ this.onReloadItems }
			></m-modules-form>
		</main>
		`;
	}

	public static override styles = css`
	:host {
		overflow: hidden;
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-template-rows: 1fr;
		grid-auto-rows: 0px;
	}
	aside {
		overflow: hidden;
		background-color: teal;
		width: 200px;
		display: grid;
		grid-template-rows: max-content 1fr;
	}
	main {
		overflow: hidden;
		display: grid;
		grid-template-rows: 1fr;

		& > * {
			grid-row: 1/2;
			grid-column: 1/2;
		}
	}
	`;

}
