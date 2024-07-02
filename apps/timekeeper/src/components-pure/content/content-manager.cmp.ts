import { Deferred, mapGetLazy } from '@eyeshare/shared';
import { componentStyles, listen, ObservableMap, ObservableSet } from '@eyeshare/web-components';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { MiContentCmp } from './content.cmp.js';
import { MiContentWindowCmp } from './content-window.cmp.js';

MiContentCmp; MiContentWindowCmp;
/* ------------------------------------------------- */

export interface ContentMetadata {
	//connectedCategories: CategoryKeys[];
	referenceEvent?: PointerEvent;
	preWindowCategories?: string[];

}

export interface ContentObject {
	element: MiContentCmp;
	metadata: ContentMetadata;
}

type ContentID = string;

type AnyString = (string & Record<never, never>)

export type CategoryKeys = 'all' | 'window' | 'sidepanel' | 'focus' | AnyString;

/* ------------------------------------------------- */

@customElement('mi-content-manager')
export class MiContentManagerCmp extends LitElement {

	//#region properties
	public contentStore = new ObservableMap<ContentID, ContentObject>;
	public contentRegistry = new Map<CategoryKeys, ObservableSet<ContentID>>;
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	protected override createRenderRoot() {
		return this;
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();

		this.contentStore.disconnect();
		this.contentStore.clear();
		this.contentRegistry.forEach(set => { set.disconnect(); set.clear(); });
		this.contentRegistry.clear();
	}
	//#endregion


	//#region logic
	//#endregion


	//#region template
	public override render() {
		let windowReg = mapGetLazy(this.contentRegistry, 'window', new ObservableSet());

		return html`
		${ repeat(windowReg, id => id, id => {
			let contentObj = this.contentStore.get(id)!;

			return html`
			<mi-content-window .referenceEvent=${ contentObj.metadata?.referenceEvent }>
				${ contentObj.element }
			</mi-content-window>
			`;
		}) }
		`;
	}
	//#endregion


	//#region style
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-content-manager': MiContentManagerCmp;
	}

	interface HTMLElementEventMap {
		'mi-get-available-ref': CustomEvent<{ deferred: Deferred }>;
		'mi-get-window-ref': CustomEvent<{ deferred: Deferred }>;
		'mi-register-content': CustomEvent<{ content: MiContentCmp[] }>;
		'mi-open-window': CustomEvent<{ id: string; deferred: Deferred; event?: PointerEvent }>;
		'mi-close-window': CustomEvent<{ id: string; deferred: Deferred; }>;
	}
}
