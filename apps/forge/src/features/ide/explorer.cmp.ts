import { SignalWatcher } from '@lit-labs/preact-signals';
import {
	Adapter, AegisComponent, customElement,
	inject, query, queryAll, state,
} from '@roenlie/lit-aegis';
import { MMButton } from '@roenlie/mimic-elements/button';
import { MMIcon } from '@roenlie/mimic-elements/icon';
import { MMTooltip } from '@roenlie/mimic-elements/tooltip';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { html } from 'lit';
import { when } from 'lit/directives/when.js';
import { join, normalize, parse, sep } from 'posix-path-browser';

import { ForgeFile, ForgeFileDB } from '../filesystem/forge-file.js';
import { MimicDB } from '../filesystem/mimic-db.js';
import type { ExplorerStore } from '../stores/explorer-store.js';
import { StyleController } from '../../app/style-controller.js';
import explorerStyles from './explorer.css' with { type: 'css' };
import { type AccordianAction, ExplorerAccordianCmp } from './explorer-accordian.cmp.js';
import { FileDetailsCmp } from './file-details.cmp.js';
import { FileExplorerCmp } from './file-explorer.cmp.js';

MMIcon.register();
MMButton.register();
MMTooltip.register();
FileDetailsCmp.register();
FileExplorerCmp.register();
ExplorerAccordianCmp.register();


@SignalWatcher
@customElement('m-explorer')
export class ExplorerCmp extends AegisComponent {

	constructor() { super(ExplorerAdapterCmp); }

}


export class ExplorerAdapterCmp extends Adapter {

	@inject(Ag.explorerStore) protected store: ExplorerStore;
	@state() protected activeId = '';
	@query('m-file-explorer') protected fileExplorerEl: FileExplorerCmp;
	@queryAll('m-explorer-accordian') protected accordianEls: NodeListOf<HTMLElement>;

	protected fileExplorerActions: AccordianAction[] = [
		{
			label:  'New File...',
			icon:   'https://icons.getbootstrap.com/assets/icons/file-earmark-plus.svg',
			action: () => this.handleNewFile(),
		},
		{
			label:  'New Folder...',
			icon:   'https://icons.getbootstrap.com/assets/icons/folder-plus.svg',
			action: () => this.handleNewFile(),
		},
		{
			label:  'Collapse Folders in Explorer',
			icon:   'https://icons.getbootstrap.com/assets/icons/dash-square.svg',
			action: () => {},
		},
	];

	public override async connectedCallback() {
		this.store.files = (await MimicDB.connect(ForgeFileDB).collection(ForgeFile)
			.getAll())
			.filter(file => file.project === this.store.project);
	}

	protected async handleFilesFocusout() {
		const collection = MimicDB.connect(ForgeFileDB).collection(ForgeFile);
		const files = this.store.files.filter(file => file.editingName && file.name);
		const fileTransactions: Promise<any>[] = [];

		let fileToFocus = '';

		for (const file of files) {
			const parsed = parse(file.name);
			if (parsed.dir) {
				parsed.dir.split(sep).forEach((dir, i, arr) => {
					if (!dir)
						return;

					const folder = ForgeFile.create({
						project:     this.store.project,
						directory:   join(file.directory, ...arr.slice(0, i)),
						name:        dir,
						extension:   '',
						content:     '',
						editingName: false,
					});

					fileTransactions.push(collection.tryAdd(folder));
				});
			}

			file.editingName = false;
			file.name = parsed.name;
			file.extension = parsed.ext;
			file.directory =  normalize(parsed.dir
				? join(file.directory, parsed.dir)
				: file.directory);

			fileTransactions.push(collection.add(file));
			fileToFocus = file.id;
		}

		await Promise.allSettled(fileTransactions);

		this.store.files = await collection.getAll();
		this.updateComplete
			.then(() => this.fileExplorerEl.updateComplete)
			.then(() => this.activeId = fileToFocus);
	}

	protected handleNewFile() {
		if (this.store.files.some(file => file.editingName))
			return;

		let activeDir = '/';

		const item = this.store.activeScript;
		if (item) {
			if (item.extension)
				activeDir = item.directory;
			else
				activeDir = item.path;
		}

		this.store.files = [
			...this.store.files,
			ForgeFile.create({
				project:     this.store.project,
				directory:   activeDir,
				extension:   '',
				name:        '',
				editingName: true,
				content:     '',
			}),
		];

		window.addEventListener('mousedown', (ev) => {
			const path = ev.composedPath() as HTMLElement[];
			if (!path.some(el => el === this.fileExplorerEl))
				this.handleFilesFocusout();
		}, { once: true });
	}

	protected handleAccordianToggle(ev: Event) {
		const target = (ev.composedPath() as HTMLElement[])
			.find(el => el.localName === 'm-explorer-accordian') as ExplorerAccordianCmp | undefined;

		if (target) {
			target.expanded = !target.expanded;
			this.requestUpdate();
		}
	}

	protected async handleSelectItem(ev: HTMLElementEventMap['select-item']) {
		await this.updateComplete;
		this.activeId = ev.detail?.id ?? '';
		this.store.activeScript = ev.detail;
	}

	protected styleCtrl = new StyleController(this.element, css => css`
		s-explorer-content {
			grid-template-rows: ${ [ ...this.accordianEls ].map(el =>
				el.hasAttribute('expanded')
					? 'minmax(32px, 1fr)'
					: 'minmax(32px, 0fr)')
				.join(' ')
			}
		}
	`);

	public override render(): unknown {
		return html`
		<s-explorer-header>
			<span>
				EXPLORER
			</span>
			<mm-button
				type="icon"
				variant="text"
				size="small"
				shape="rounded"
			>
				<mm-icon
					style="font-size:18px;"
					url="https://icons.getbootstrap.com/assets/icons/three-dots.svg"
				></mm-icon>
			</mm-button>
		</s-explorer-header>

		<s-explorer-content
			@expand=${ this.handleAccordianToggle.bind(this) }
			@collapse=${ this.handleAccordianToggle.bind(this) }
		>
			<m-explorer-accordian
				expanded
				id="file-explorer"
				header="files"
				.actions=${ [
					{
						label:  'New File...',
						icon:   'https://icons.getbootstrap.com/assets/icons/file-earmark-plus.svg',
						action: () => this.handleNewFile(),
					},
					{
						label:  'New Folder...',
						icon:   'https://icons.getbootstrap.com/assets/icons/folder-plus.svg',
						action: () => this.handleNewFile(),
					},
					{
						label:  'Collapse Folders in Explorer',
						icon:   'https://icons.getbootstrap.com/assets/icons/dash-square.svg',
						action: () => {},
					},
				] }
			>
				<m-file-explorer
					.activeId      =${ this.activeId ?? '' }
					.items         =${ this.store.files as any }
					@select-item   =${ this.handleSelectItem.bind(this) }
					@input-focusout=${ this.handleFilesFocusout.bind(this) }
				></m-file-explorer>
			</m-explorer-accordian>

			${ when(this.activeId, () => html`
			<m-explorer-accordian
				header="File Details"
				expanded
			>
				<m-file-details
					.activeId=${ this.activeId ?? '' }
				></m-file-details>
			</m-explorer-accordian>
			`) }
		</s-explorer-content>
		`;
	}

	public static override styles = [ sharedStyles, explorerStyles ];

}
