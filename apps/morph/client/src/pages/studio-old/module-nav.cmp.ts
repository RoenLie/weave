import { MimicElement, customElement } from '@roenlie/lit-utilities/element';
import { css, html } from 'lit';

import { DragHandleCmp } from '../../features/components/drag-handle/drag-handle.cmp.js';
import { sharedStyles } from '../../features/styles/shared-styles.js';
import { ModuleNavSelector } from './module-nav-selector.cmp.js';

DragHandleCmp.register();
ModuleNavSelector.register();

@customElement('m-module-nav')
export class ModuleNavCmp extends MimicElement {
	protected override render(): unknown {
		return html`
		<m-module-nav-selector header="Namespaces"></m-module-nav-selector>
		<m-drag-handle></m-drag-handle>
		<m-module-nav-selector header="Modules"></m-module-nav-selector>
		<m-drag-handle></m-drag-handle>
		<m-module-nav-selector header="Active"></m-module-nav-selector>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			--namespace-height: 1fr;
			--module-height: 1fr;
			--active-height: 1fr;
			display: grid;
			grid-template-rows: var(--namespace-height)
			20px var(--module-height)
			20px var(--active-height);
			padding-block: 10px;
			overflow: hidden;
		}
		`,
	];
}
