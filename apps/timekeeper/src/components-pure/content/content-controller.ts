import { DOMQuery, mapGetLazy } from '@eyeshare/shared';
import { ObservableSet } from '@eyeshare/web-components';
import type { LitElement, ReactiveController, ReactiveControllerHost } from 'lit';

import { MiContentCmp } from './content.cmp.js';
import { CategoryKeys, ContentObject, MiContentManagerCmp } from './content-manager.cmp.js';

/* ------------------------------------------------- */

export class ContentController implements ReactiveController {

	protected subscriptions: { id: string; unobserve: () => void; }[] = [];
	protected manager: MiContentManagerCmp;
	protected host: ReactiveControllerHost & LitElement;

	constructor(options: { host: ReactiveControllerHost & LitElement }) {
		const { host } = options;
		(this.host = host).addController(this);
	}

	public hostConnected() {
		this.findClosestManager();
	}

	public hostDisconnected() {
		this.manager = undefined as any;
		this.subscriptions.forEach(obs => obs.unobserve());
		this.subscriptions.length = 0;
	}

	protected findClosestManager() {
		const manager = DOMQuery.findFirstNode(this.host,
			(node: MiContentManagerCmp) => node instanceof MiContentManagerCmp);

		if (manager)
			this.manager = manager;
	}

	public registerContent(content: { category: CategoryKeys, component: MiContentCmp }[]) {
		content.forEach(({ category, component }) => {
			/* Add the content object to the content store */
			mapGetLazy(this.manager.contentStore, component.id, () => ({
				element:  component,
				metadata: {},
			}));

			/* Add the content id to the global category */
			let globalReg = mapGetLazy(this.manager.contentRegistry, 'all', new ObservableSet());
			globalReg.add(component.id);

			/* Add the content id to the category requested */
			let catReg = mapGetLazy(this.manager.contentRegistry, category, new ObservableSet());
			catReg.add(component.id);
		});
	}

	public observeCategory(
		category: CategoryKeys,
		fn: (options: {
			id: string | undefined;
			content?: ContentObject | undefined;
			operation: 'add' | 'remove' | 'clear';
		}) => void,
	) {
		let categorySet = mapGetLazy(this.manager.contentRegistry, category, new ObservableSet());
		let subscription = categorySet.observe((from, { value }, operation) => {
			fn({
				id:      value,
				content: value ? this.manager.contentStore.get(value) : undefined,
				operation,
			});
		});

		this.subscriptions.push(subscription);
	}

	public *getCategory(category: CategoryKeys) {
		let categorySet = mapGetLazy(this.manager.contentRegistry, category, new ObservableSet());
		for (const id of categorySet) {
			let contentObj = this.manager.contentStore.get(id);
			if (contentObj)
				yield contentObj;
		}
	}

	public getByID(id: string) {
		return this.manager.contentStore.get(id);
	}

	public openAsWindow(id: string, ev?: PointerEvent) {
		let contentObj = this.manager.contentStore.get(id);
		if (!contentObj)
			return console.error('No content with matching ID found.');

		if (!contentObj.metadata.preWindowCategories)
			contentObj.metadata.preWindowCategories = [];

		if (ev)
			contentObj.metadata.referenceEvent = ev;

		this.manager.contentRegistry.forEach((set, key) => {
			if (key === 'all' || !set.has(id))
				return;

			contentObj?.metadata.preWindowCategories?.push(key);
			set.delete(id);
		});

		let windowSet = mapGetLazy(this.manager.contentRegistry, 'window', new ObservableSet());
		windowSet.add(id);

		this.manager.requestUpdate();
	}

	public closeWindow(id: string, category?: CategoryKeys) {
		let contentObj = this.manager.contentStore.get(id);
		if (!contentObj)
			return console.error('No content with matching ID found.');

		this.manager.contentRegistry.forEach((set, key) => {
			if (key === 'all')
				return;

			if (key === 'window')
				set.delete(id);

			if (category) {
				if (key === category)
					set.add(id);
			}
			else if (contentObj?.metadata.preWindowCategories?.includes(key)) {
				set.add(id);
			}
		});

		this.manager.requestUpdate();
	}

}
