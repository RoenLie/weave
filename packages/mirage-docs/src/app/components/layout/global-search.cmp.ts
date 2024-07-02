import { type ElapsedTime } from '@orama/orama';
import { Adapter, AegisComponent, ContainerLoader, customElement, query, state } from '@roenlie/lit-aegis';
import { css, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { live } from 'lit/directives/live.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import { componentStyles } from '../../styles/component.styles.js';
import { createSearchWorker } from '../../workers/search-worker.js';
import { Icon, xIcon } from './icons.js';


interface CustomResult {
	/** The number of all the matched documents. */
	count: number;
	/** An array of matched documents taking `limit` and `offset` into account. */
	hits: ExpandedDoc[];
	/** The time taken to search. */
	elapsed: ElapsedTime;
}


interface ExpandedDoc {
	id: string;
	score: number;
	document: {
		readonly type: string;
		readonly content: string;
		readonly path: string;
		modifiedPath: string;
		displayPath: string;
		displayText: string;
	};
}


export class GlobalSearchAdapter extends Adapter {

	@state() protected searchValue = '';
	@state() protected searchResult: any[] = [];
	@state() protected activeSearchEl?: HTMLElement;
	@query('dialog') public dialogQry: HTMLDialogElement;
	protected searchWorker: Worker;
	protected get colorScheme() {
		return document.documentElement.getAttribute('color-scheme') ?? '';
	}

	protected colorSchemeObs = new MutationObserver(() => {
		this.element.setAttribute('color-scheme', this.colorScheme);
	});

	protected dialogObs = new MutationObserver(() => this.handleDialogToggle());
	protected hotkeyListener = (ev: KeyboardEvent) => {
		if (ev.code === 'KeyP' && ev.ctrlKey) {
			ev.preventDefault();
			this.dialogQry.showModal();
		}
	};

	protected inputKeyListener(ev: KeyboardEvent) {
		if (ev.code === 'ArrowUp') {
			ev.preventDefault();
			const allEls = [ ...this.querySelectorAll('ul li')! ] as HTMLElement[];
			if (!this.activeSearchEl) {
				this.activeSearchEl = allEls[0];
				this.activeSearchEl?.classList?.toggle('active', true);
			}
			else {
				this.activeSearchEl.classList.toggle('active', false);
				this.activeSearchEl = this.activeSearchEl.previousElementSibling as HTMLElement ?? allEls.at(-1)!;
				this.activeSearchEl?.classList?.toggle('active', true);
			}
		}
		if (ev.code === 'ArrowDown') {
			ev.preventDefault();
			const allEls = [ ...this.querySelectorAll('ul li')! ] as HTMLElement[];
			if (!this.activeSearchEl) {
				this.activeSearchEl = allEls[0];
				this.activeSearchEl?.classList?.toggle('active', true);
			}
			else {
				this.activeSearchEl.classList.toggle('active', false);
				this.activeSearchEl = this.activeSearchEl.nextElementSibling as HTMLElement ?? allEls[0]!;
				this.activeSearchEl?.classList?.toggle('active', true);
			}
		}
		if (ev.code === 'Enter') {
			ev.preventDefault();
			this.activeSearchEl?.querySelector('a')?.click();
		}
	}

	public override async connectedCallback() {
		this.searchWorker = createSearchWorker();
		this.searchWorker.onmessage = this.handleWorkerResponse;
		this.colorSchemeObs.observe(document.documentElement,
			{ attributes: true, attributeFilter: [ 'color-scheme' ] });

		window.addEventListener('keydown', this.hotkeyListener);

		setTimeout(() => this.updateComplete.then(() => {
			this.element.setAttribute('color-scheme', this.colorScheme);
			this.dialogObs.observe(this.dialogQry, { attributes: true, attributeFilter: [ 'open' ] });
		}));
	}

	public override disconnectedCallback() {
		this.searchWorker.terminate();
		this.dialogObs.disconnect();
		this.colorSchemeObs.disconnect();
		window.removeEventListener('keydown', this.hotkeyListener);
	}

	//#region events
	protected handleClick() {
		this.dialogQry.showModal();
	}

	protected handleDialogToggle() {
		if (this.dialogQry.open) {
			const allEls = [ ...this.querySelectorAll('ul li')! ] as HTMLElement[];
			if (!allEls.some(el => this.activeSearchEl === el))
				this.activeSearchEl = allEls[0];

			this.requestWorkerResponse({
				term:       this.searchValue,
				properties: '*',
			});

			const inputEl = this.querySelector<HTMLInputElement>('input');
			inputEl?.focus();
			inputEl?.select();
		}
	}

	protected handleDialogInput(ev: InputEvent & {target: HTMLInputElement}) {
		const value = ev.target.value;
		this.searchValue = value;

		this.requestWorkerResponse({
			term:       value,
			properties: '*',
		});
	}

	protected handleLinkClick = (ev: Event, route: string) => {
		ev.preventDefault();

		const hash = '#' + route;
		if (location.hash === hash)
			return;

		const { base } = ContainerLoader.get<SiteConfig>('site-config').env!;
		history.pushState({}, '', base + hash);

		dispatchEvent(new HashChangeEvent('hashchange'));

		this.dialogQry.close();
		this.requestUpdate();
	};
	//#endregion


	//#region Worker
	protected requestWorkerResponse = async (search: any) => {
		this.searchWorker.postMessage(search);
	};

	protected handleWorkerResponse = async ({ data }: MessageEvent<CustomResult>) => {
		this.searchResult = data.hits.map(hit => {
			const modifiedPath = hit.document.path.split(':').at(0) ?? '';
			const displayText = hit.document.content.slice(0, 20);
			const displayPath = modifiedPath
				.split('/')
				.map(s => s
					.replace(/^\d+\./, '')
					.replace(/^_/, '')
					.replaceAll('-', ' '))
				.join('/');

			const expandedHit: ExpandedDoc = {
				...hit,
				document: {
					...hit.document,
					modifiedPath,
					displayPath,
					displayText,
				},
			};

			return expandedHit;
		}).filter((hit, idx, arr) => {
			return !arr.slice(idx + 1, arr.length)
				.some(h => h.document.modifiedPath === hit.document.modifiedPath);
		});

		await this.updateComplete;
		const allEls = [ ...this.querySelectorAll('ul li:not(:has(a.current))')! ] as HTMLElement[];
		if (!this.activeSearchEl || !allEls.some(el => this.activeSearchEl === el)) {
			this.activeSearchEl?.classList.toggle('active', false);
			this.activeSearchEl = allEls[0];
			this.activeSearchEl?.classList.toggle('active', true);
		}
	};
	//#endregion


	//#region Template
	protected searchIconTemplate() {
		return html`
		<svg xmlns="http://www.w3.org/2000/svg" color="currentColor" viewBox="0 0 512 512">
			<path fill="currentColor"
				d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0
				45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0
				322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288
				144 144 0 1 0 0 288z" />
		</svg>
		`;
	}

	protected buttonTemplate() {
		return html`
		<button class="button" @click=${ this.handleClick.bind(this) }>
			<span class="icon">
			${ this.searchIconTemplate() }
			</span>
			<span class="label">
				Search
			</span>
			<span class="hotkey">
				Ctrl P
			</span>
		</button>
		`;
	}

	protected dialogTemplate() {
		return html`
		<dialog class="search">
			<div class="base">
				<div class="icon-wrapper">
					<input
						.value=${ live(this.searchValue) }
						@input=${ this.handleDialogInput.bind(this) }
						@keydown=${ this.inputKeyListener.bind(this) }
					/>
					<div class="input-icon" @click=${ () => this.dialogQry.close() }>
						${ Icon(xIcon) }
					</div>
				</div>

				<div class="results">
					<ul>
						${ map(this.searchResult, (result) => {
							const link = result.document.modifiedPath;
							const pathSegments = result.document.displayPath.split('/').filter(Boolean);
							const segmentHeader = pathSegments.slice(0, -1);
							const segmentBody = pathSegments.at(-1);

							return html`
							<li>
								<a
									tabindex="-1"
									href    =${ '/' + link }
									@click  =${ (ev: Event) => this.handleLinkClick(ev, link) }
									class=${ classMap({ current: location.hash === '#' + link }) }
								>
								<div class="link-header">
									${ map(segmentHeader, (seg, i) => html`
									<span>${ seg }</span>
									${ when(i !== segmentHeader.length - 1, () => html`<span>></span>`) }
									`) }
								</div>
								<div class="link-text">
									${ segmentBody }
								</div>
								</a>
							</li>
							`;
						}) }
					</ul>
				</div>
			</div>
		</dialog>
		`;
	}

	public override render() {
		return html`
		${ this.buttonTemplate() }
		${ this.dialogTemplate() }
		`;
	}
	//#endregion


	//#region Style
	public static override styles = [
		componentStyles,
		css`
		:host {
			display: block;
		}
		:host([color-scheme="dark"]) {
			--button-border-color: rgb(50,50,50);
			--button-background-color: rgb(30,35,35);
			--button-box-shadow-color: rgb(30 30 30);

			--hotkey-border-color: rgb(50, 50, 50);
			--hotkey-background-color: rgb(30,30,30);

			--dialog-border-color: rgb(50,50,50);
			--dialog-background-color: rgb(30,35,35);

			--item-border-color: rgb(50, 50, 50);
			--item-background-color: rgb(30,30,30);
		}
		:host([color-scheme="light"]) {
			--button-border-color: rgb(50,50,50);
			--button-background-color: rgb(240,240,240);
			--button-box-shadow-color: rgb(30 30 30);

			--hotkey-border-color: rgb(50, 50, 50);
			--hotkey-background-color: rgb(230,230,230);

			--dialog-border-color: rgb(50,50,50);
			--dialog-background-color: rgb(240,240,240);

			--item-border-color: rgb(50, 50, 50);
			--item-background-color: rgb(230,230,230);
		}

		button.button {
			user-select: none;
			display: flex;
			flex-flow: row nowrap;
			place-items: center;
			width: max-content;
			height: max-content;
			gap: 8px;
			padding: 8px;
			border: 1px solid var(--button-border-color);
			border-radius: 6px;
			background-color: var(--button-background-color);
			box-shadow: 0px 0px 4px var(--button-box-shadow-color);
		}
		button.button:hover {
			outline: 1px solid orange;
			outline-offset: 2px;
			cursor: pointer;
		}
		.icon-wrapper {
			display: grid;
			grid-template-columns: 1fr max-content;
			align-items: center;
			gap: 12px;
		}
		.input-icon {
			padding: 6px;
			cursor: pointer;
			border: 1px solid transparent;
		}
		.input-icon:hover {
			box-shadow: 0px 0px 3px rgb(50,50,50);
			border-radius: 8px;
			border-color: var(--item-border-color);
			background-color: var(--item-background-color);
		}
		.icon {
			display: grid;
			place-items: center;
		}
		.icon svg {
			height: 1em;
			width: 1em;
		}
		.label {
			font-weight: bold;
			line-height: 1em;
		}
		.hotkey {
			padding: 3px;
			border: 1px solid grey;
			border-radius: 4px;

			line-height: 1em;
			border: 1px solid var(--hotkey-border-color);
			background-color: var(--hotkey-background-color);
			border-radius: 4px;
			font-size: 0.7em;
			padding-inline: 4px;
			padding-block: 3px;
			font-weight: bold;
		}
		dialog.search {
			color: var(--midoc-on-background);
			border-radius: var(--midoc-border-radius-s);
			border: 1px solid var(--dialog-border-color);
			background-color: var(--dialog-background-color);
			margin-top: 50px;
			width: clamp(400px, 50vw, 600px);
    		height: clamp(400px, 70vh, 600px);
		}
		dialog .base {
			height: 100%;
			display: grid;
			grid-template-rows: auto 1fr;
			gap: 8px;
		}
		dialog .results {
			display: grid;
			border: 1px solid var(--item-border-color);
			padding: 8px;
			border-radius: 6px;
			overflow: auto;
		}
		.results ul {
			display: flex;
			flex-flow: column nowrap;
			gap: 8px;
		}
		.results ul li {
			list-style: none;
			padding-block: 8px;
			padding-inline: 8px;
			border-radius: 8px;
			border: 1px solid var(--item-border-color);
			background-color: var(--item-background-color);
		}
		.results ul li.active {
			border-color: orange;
		}
		.results ul li a {
			text-decoration: none;
			color: inherit;
			display: flex;
			flex-flow: column nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		a.current {
			opacity: 0.3;
		}
		dialog input {
			all: unset;
			background-color: transparent;
			border: 1px solid var(--item-border-color);
			border-radius: 6px;
			padding: 8px;
		}
		dialog .link-header {
			display: flex;
			align-items: center;
			overflow: hidden;
			font-size: 0.7em;
			font-weight: 500;
			color: var(--midoc-tertiary);
			gap: 4px;
		}
		dialog .link-header span {
			text-overflow: ellipsis;
			overflow: hidden;
			white-space: nowrap;
		}
		`,
	];
	//#endregion

}


@customElement('midoc-global-search')
export class GlobalSearchCmp extends AegisComponent {

	public override adapter: GlobalSearchAdapter;

	constructor() {
		super(GlobalSearchAdapter);
	}

}
