import { SignalWatcher } from '@lit-labs/preact-signals';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { IModule } from '../../../../models/modules-model.js';
import type { ModulesStore } from './modules-store.js';


@customElement('m-modules-sidebar')
export class ModulesSidebar extends SignalWatcher(LitElement) {

	@property({ type: Object }) public store: ModulesStore;

	protected onButtonClick(module: IModule) {
		return (_ev: Event) => {
			this.store.selectedModule.value = module;
		};
	}

	protected override render() {
		return html`
		<ol>
			${ this.store.modules.value.map(mod => html`
			<li class="${
				mod.module_id === this.store.selectedModule.value?.module_id
					? 'active' : ''
				}"
			>
				<button
					@click=${ this.onButtonClick(mod) }
				>
					${ mod.name }
				</button>
			</li>
			`) }
		</ol>
		`;
	}

	public static override styles = css`
	:host {
		display: block;
		overflow: hidden;
		overflow-y: auto;
	}
	ol {
		all: unset;
		display: block;
		padding-inline-start: 24px;
		padding-block: 24px;
	}
	li {
		all: unset;
		display: block;
	}
	li.active {
		background-color: hotpink;
		outline: 2px dotted red;
		outline-offset: -2px;
	}
	`;

}
