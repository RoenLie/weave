import { AegisElement, customElement } from '@roenlie/lit-aegis';
import { emitEvent } from '@roenlie/mimic-core/dom';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { html, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { keyed } from 'lit/directives/keyed.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';

import { match } from '../directives/switch.js';
import type { ForgeFile } from '../filesystem/forge-file.js';
import fileExplorerStyles from './file-explorer.css' with { type: 'css' };


export type ExplorerItem = ExplorerFolder | ExplorerFile;

export interface ExplorerFile {
	data: ForgeFile;
	active: boolean;
	selected: boolean;
	parent: ExplorerFolder | undefined;
}

export interface ExplorerFolder extends ExplorerFile {
	open: boolean;
	children: ExplorerItem[];
	parent: ExplorerFolder | undefined;
}

export interface ExplorerItemElement extends HTMLElement {
	item: ExplorerItem;
}

export interface ExplorerInputElement extends HTMLInputElement {
	item: ExplorerItem;
}


@customElement('m-file-explorer')
export class FileExplorerCmp extends AegisElement {

	protected static isFolder(item?: ExplorerItem): item is ExplorerFolder {
		return !!(item && 'open' in item);
	}

	protected static isFile(item?: ExplorerItem): item is ExplorerFile {
		return !!(item && !('open' in item));
	}

	protected static findFirstElement<T>(event: Event, tagname: string) {
		return event.composedPath()
			.find(el => (el as HTMLElement).localName === tagname) as T | undefined;
	}

	@property() public set activeId(id: string) {
		this.setActiveItem(id);
	}

	public get activeId() { return this.activeItem?.data.id ?? ''; }

	public get activeItem(): ExplorerItem | undefined {
		let item: ExplorerItem | undefined = undefined;
		this.itemSet.forEach(node => {
			if (node.active)
				item = node;
		});

		return item;
	}

	@property({ type: Array }) public items?: ForgeFile[];
	@state() protected roots: ExplorerItem[] = [];
	protected itemSet = new Set<ExplorerItem>();

	protected override willUpdate(props: Map<PropertyKey, unknown>): void {
		if (props.has('items') && this.items)
			this.updateItems();
	}

	public setActiveItem(id: string | undefined) {
		const previousItem = this.activeItem;
		if (previousItem?.data.id === id)
			return;

		this.itemSet.forEach(node => { node.active = node.data.id === id; });
		const activeItem = this.activeItem;

		// open any parent folders that contain the active item.
		let currentItem = activeItem?.parent;
		while (FileExplorerCmp.isFolder(currentItem)) {
			currentItem.open = true;
			currentItem = currentItem.parent;
		}

		this.requestUpdate();
		emitEvent(this, 'select-item', { detail: this.activeItem?.data });
	}

	protected updateItems() {
		const itemSet = new Set<ExplorerItem>();
		const files: ExplorerFile[] = [];
		const folders: ExplorerFolder[] = [];
		const roots: ExplorerItem[] = [];

		for (const item of this.items ?? []) {
			let exItem: ExplorerItem | undefined = undefined;

			this.itemSet.forEach(node => {
				if (node.data.id === item.id)
					exItem = node;
			});

			if (!item.extension && !item.editingName) {
				if (!exItem) {
					exItem = {
						active:   false,
						selected: false,
						open:     false,
						data:     item,
						children: [],
						parent:   undefined,
					} satisfies ExplorerFolder;
				}

				// If going from an editing state to a folder.
				// the open property has not been added, even if the item exists.
				exItem.open = !!exItem.open;
				folders.push(exItem);
			}
			else {
				if (!exItem) {
					exItem = {
						active:   false,
						selected: false,
						data:     item,
						parent:   undefined,
					} satisfies ExplorerFile;
				}

				files.push(exItem);
			}

			// We clear out the children, as we relink these below.
			if (FileExplorerCmp.isFolder(exItem))
				exItem.children = [];

			if (item.directory === '/')
				roots.push(exItem);

			itemSet.add(exItem);
		}

		// Link folder hierarchy structure then add files into the correct folders.
		for (const item of [ ...folders, ...files ]) {
			// find parent folder.
			const parent = folders.find(f => f.data.path === item.data.directory);
			if (!parent)
				continue; // folder is in root.

			item.parent = parent;
			if (!parent.children.some(i => i === item))
				parent.children.push(item);
		}

		// open any parent folders that contain an item being edited.
		for (const file of files) {
			if (!file.data.editingName)
				continue;

			let currentItem = file.parent;
			while (FileExplorerCmp.isFolder(currentItem)) {
				currentItem.open = true;
				currentItem = currentItem.parent;
			}
		}

		this.roots = roots;
		this.itemSet = itemSet;
	}

	protected handleItemClick(ev: PointerEvent) {
		ev.preventDefault();

		type E = ExplorerItemElement;
		const item = FileExplorerCmp.findFirstElement<E>(ev, 's-explorer-item')?.item;
		if (!item)
			return;

		if (FileExplorerCmp.isFolder(item))
			item.open = !item.open;

		emitEvent(this, 'select-item', { detail: item?.data });
		this.requestUpdate();
	}

	protected handleInputFocusout(_ev: FocusEvent) {
		emitEvent(this, 'input-focusout');
	}

	protected handleInputInput(ev: InputEvent) {
		const el = ev.currentTarget as ExplorerInputElement;
		el.item.data.name = el.value;
	}

	protected handleInputKeydown(ev: KeyboardEvent) {
		const key = ev.key;
		if (key !== 'Enter')
			return;

		ev.preventDefault();
		const el = ev.currentTarget as ExplorerInputElement;
		el.blur();
	}

	protected renderContent(items: ExplorerItem[], depth: number, root = false): TemplateResult {
		return html`
		<s-explorer-content class=${ classMap({ root }) } style="--depth:${ depth };">
			${ repeat(
				items,
				item => item.data.id,
				item => match(item, [
					[
						item => item.data.editingName,
						() => this.renderInput(item),
					],
					[
						item => 'children' in item,
						() => this.renderFolder(item as ExplorerFolder, depth),
					],
				], () => this.renderFile(item)),
			) }
		</s-explorer-content>
		`;
	}

	protected renderInput(item: ExplorerItem): unknown {
		this.updateComplete.then(() =>
			this.shadowRoot?.querySelector('input')?.focus());

		return html`
		<s-explorer-item
			.item=${ item }
			class=${ classMap({ active: item.active }) }
		>
		${ keyed(item.data.id, html`
		<input
			.item=${ item }
			.value=${ live(item.data.name) }
			@input=${ this.handleInputInput }
			@keydown=${ this.handleInputKeydown }
			@focusout=${ this.handleInputFocusout }
		/>
		`) }
		</s-explorer-item>
		`;
	}

	protected renderFile(item: ExplorerFile): unknown {
		return html`
		<s-explorer-item
			.item=${ item }
			class=${ classMap({ active: item.active }) }
		>
			<span></span>
			<mm-icon
				style="font-size:12px;"
				url="https://icons.getbootstrap.com/assets/icons/file-earmark-text.svg"
			></mm-icon>
			<s-item>
				${ item.data.name }${ item.data.extension }
			</s-item>
		</s-explorer-item>
		`;
	}

	protected renderFolder(item: ExplorerFolder, depth: number): unknown {
		return html`
		<s-explorer-item
			.item=${ item }
			class=${ classMap({ active: item.active }) }
		>
			<mm-icon
				style="font-size:12px;"
				url=${ item.open
					? 'https://icons.getbootstrap.com/assets/icons/chevron-down.svg'
					: 'https://icons.getbootstrap.com/assets/icons/chevron-right.svg' }
			></mm-icon>
			<mm-icon
				style="font-size:12px;"
				url=${ item.open
					? 'https://icons.getbootstrap.com/assets/icons/folder2-open.svg'
					: 'https://icons.getbootstrap.com/assets/icons/folder2.svg' }
			></mm-icon>
			<s-folder>
				${ item.data.name }
			</s-folder>
		</s-explorer-item>
		${ when(item.open, () => this.renderContent(item.children, depth + 1)) }
		`;
	}

	protected override render(): unknown {
		return html`
		<div style="display:contents;" @click=${ this.handleItemClick }>
			${ this.renderContent(this.roots, 1, true) }
		</div>
		`;
	}

	public static override styles = [ sharedStyles, fileExplorerStyles ];

}


declare global {
	interface HTMLElementTagNameMap {
		'm-file-explorer': FileExplorerCmp;
	}
	interface HTMLElementEventMap {
		'select-item': CustomEvent<ForgeFile | undefined>;
	}
}
