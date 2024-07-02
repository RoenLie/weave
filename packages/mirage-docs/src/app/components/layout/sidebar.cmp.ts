import {
	Adapter, AegisComponent, ContainerLoader,
	customElement, inject, query, state,
} from '@roenlie/lit-aegis';
import { css, html, unsafeCSS } from 'lit';
import { when } from 'lit/directives/when.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import { buttonStyle } from '../../styles/button.styles.js';
import { componentStyles } from '../../styles/component.styles.js';
import { inputStyle } from '../../styles/input.styles.js';
import { chevronDownIcon, chevronRightIcon, Icon } from './icons.js';
import { PathTreeCmp } from './path-tree.cmp.js';

PathTreeCmp.register();


export class SidebarAdapter extends Adapter<SidebarCmp> {

	//#region properties
	@inject('site-config') protected siteConfig: SiteConfig;
	@inject('routes') protected routes: string[];
	@state() protected toggleAllValue = false;
	@state() protected toggleIndeterminate = false;
	@state() protected filteredRoutes: string[] = [];
	@query('midoc-path-tree') protected pathTreeQry: PathTreeCmp;
	protected scrollValue = 0;
	protected searchValue = localStorage.getItem('midocSidebarSearch') ?? '';
	//#endregion


	//#region lifecycle
	public override connectedCallback(): void {
		this.element.addEventListener('scroll', this.handleScroll);

		this.setIndeterminateState();
		this.handleSearch(this.searchValue, true);
	}

	public override disconnectedCallback(): void {
		this.element.removeEventListener('scroll', this.handleScroll);
	}
	//#endregion


	//#region logic
	public toggleAll = () => {
		this.toggleAllValue = this.toggleIndeterminate === true
			? false
			: !this.toggleAllValue;

		this.toggleIndeterminate = this.toggleAllValue;

		this.pathTreeQry.toggleAll(this.toggleAllValue);
	};

	protected setIndeterminateState = (override?: boolean) => {
		const menustate = JSON.parse(localStorage.getItem('midocMenuState') ?? '{}');
		this.toggleIndeterminate = override ?? Object.values(menustate).some(Boolean);
		if (!this.toggleIndeterminate)
			this.toggleAllValue = false;
	};

	protected handleScroll = () => {
		this.scrollValue = this.element.scrollTop;
		localStorage.setItem('midocSidebarScrollValue', String(this.scrollValue));
	};

	protected handleLoad = () => {
		setTimeout(() => {
			this.element.scrollTop	= Number(localStorage.getItem('midocSidebarScrollValue')) ?? 0;

			if (this.searchValue)
				this.pathTreeQry?.toggleAll(this.toggleAllValue);
		});
	};

	protected handleToggle = (ev: CustomEvent<{state: Record<string, boolean>}>) => {
		this.setIndeterminateState(Object.values(ev.detail.state).some(Boolean));
	};

	protected handleSearchInput = (ev: Event) => {
		const search = (ev.target as HTMLInputElement).value;

		this.handleSearch(search);
	};

	protected handleSearch = (search: string, initial?: boolean) => {
		const { nameReplacements } = this.siteConfig.root!.sidebar!;

		const stringReplacement = (str: string) => nameReplacements!
			.reduce((acc, [ from, to ]) => acc.replaceAll(from, to), str);

		this.filteredRoutes = this.routes.filter(path =>
			stringReplacement(path).toUpperCase().includes(search.toUpperCase()));

		if ((this.searchValue && !search) || search)
			this.toggleAllValue = !!search;

		this.searchValue = search;
		localStorage.setItem('midocSidebarSearch', search);

		if (!initial) {
			this.updateComplete.then(() => {
				this.pathTreeQry?.toggleAll(this.toggleAllValue);
				this.setIndeterminateState(this.toggleAllValue);
			});
		}
	};
	//#endregion


	//#region template
	public override render() {
		const base = this.siteConfig.env!.base;
		const layoutCfg = this.siteConfig.root!.layout!;

		return html`
			<div class="greeting">
				${ when(layoutCfg.logoSrc, () => html`
				<picture>
					<img
						height=${ layoutCfg.logoHeight! }
						src=${ (base ? base + '/' : '') + layoutCfg.logoSrc }
						alt="Logo"
					/>
				</picture>
				`) }

				<div class="title">
					${ layoutCfg.headingText! }
				</div>
			</div>

			<div class="menu-actions">
				<input
					class="search"
					type="search"
					.value=${ this.searchValue }
					@input=${ this.handleSearchInput }
				/>
				<span class="toggle-wrapper">
					<button class="toggle" @click=${ () => this.toggleAll() }>
						${ this.toggleAllValue || this.toggleIndeterminate
							? Icon(chevronDownIcon)
							: Icon(chevronRightIcon) }
					</button>
				</span>
			</div>

			<div class="menu-wrapper">
				<midoc-path-tree
					.paths=${ this.filteredRoutes }
					@load=${ this.handleLoad }
					@toggle=${ this.handleToggle }
				></midoc-path-tree>
			</div>
		`;
	}
	//#endregion


	//#region styles
	public static override styles = [
		componentStyles,
		css`
		:host {
			overflow: hidden;
			display: flex;
			flex-flow: column nowrap;
			gap: 8px;
			overflow-y: auto;
			overflow-x: hidden;
			--scrollbar-width: 0px;
			--scrollbar-height: 0px;
		}
		.greeting {
			display: grid;
			place-items: center;
			grid-auto-flow: column;
			grid-auto-columns: max-content;
			gap: 8px;
			padding-block: 16px;
			padding-inline: 1rem 0.5rem;
			color: var(--midoc-on-surface-variant);
		}
		.greeting picture {
			display: grid;
		}
		.greeting .title {
			font-size: 22px;
			font-weight: 600;
		}
		.menu-actions {
			white-space: nowrap;
			display: flex;
			place-items: center start;
			justify-content: space-between;
			gap: 8px;
			padding-inline-start: 1rem;
			padding-inline-end: 0.5rem;
		}
		.toggle-wrapper {
			padding-inline-end: 4px
		}
		${ buttonStyle('button.toggle', 30, 20) }
		.toggle-wrapper button:focus-visible {
			outline: 2px solid var(--midoc-tertiary-hover);
			outline-offset: -2px;
		}

		${ inputStyle('input.search') }

		.menu-wrapper {
			padding-left: 1rem;
			padding-right: 0.5rem;
			padding-bottom: 2rem;

			display: flex;
			flex-flow: column nowrap;
		}
		`,
	];

	static {
		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root?.styleOverrides?.sidebar;
		if (style)
			this.styles.push(unsafeCSS(style));
	}
	//#endregion

}


@customElement('midoc-sidebar')
export class SidebarCmp extends AegisComponent {

	constructor() {
		super(SidebarAdapter);
	}

}


declare global {
	interface HTMLElementTagNameMap {
		'midoc-sidebar': SidebarCmp;
	}
}
