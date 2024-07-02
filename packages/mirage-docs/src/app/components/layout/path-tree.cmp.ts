import {
	Adapter, AegisComponent,
	ContainerLoader, customElement,
	inject, state,
} from '@roenlie/lit-aegis';
import { css, html, type PropertyValues, type TemplateResult, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';
import { type FocusableElement, tabbable } from 'tabbable';

import type { SiteConfig } from '../../../shared/config.types.js';
import { buttonStyle } from '../../styles/button.styles.js';
import { componentStyles } from '../../styles/component.styles.js';
import { findActiveElement } from '../../utilities/domquery.js';
import { pathsToTree, type TreeRecord } from '../../utilities/paths-to-tree.js';
import { chevronDownIcon, chevronRightIcon, Icon } from './icons.js';


export class PathTreeAdapter extends Adapter<PathTreeCmp> {

	//#region properties
	@inject('site-config') protected siteConfig: SiteConfig;
	@state() protected groupState: Record<string, boolean> = {};
	@state() protected activeHref = '';
	protected hierarchy: TreeRecord = {};
	//#endregion


	//#region lifecycle
	public override connectedCallback(): void {
		this.element.addEventListener('keydown', this.handleKeydown);
		window.addEventListener('hashchange', this.handleHashChange, { passive: true });

		this.groupState = JSON.parse(localStorage.getItem('midocMenuState') ?? '{}');

		setTimeout(async () => {
			await this.updateComplete;
			this.element.dispatchEvent(new CustomEvent('load', {
				cancelable: false,
				bubbles:    false,
				composed:   false,
			}));

			this.handleHashChange();
		}, 0);
	}

	public override disconnectedCallback(): void {
		this.element.removeEventListener('keydown', this.handleKeydown);
		window.removeEventListener('hashchange', this.handleHashChange);
	}

	public override willUpdate(props: PropertyValues): void {
		if (props.has('paths')) {
			const { delimiter, nameReplacements } = this.siteConfig.root!.sidebar!;

			this.hierarchy = pathsToTree(
				this.element.paths,
				delimiter!,
				nameReplacements!,
			);
		}

		if (props.has('groupState'))
			localStorage.setItem('midocMenuState', JSON.stringify(this.groupState));
	}
	//#endregion


	//#region logic
	public toggleAll(value: boolean) {
		const toggle = (hierarchy: Record<string, string | any>) => {
			Object.entries(hierarchy).forEach(([ dir, next ]) => {
				if (typeof next !== 'string') {
					this.groupState[dir] = value;
					toggle(next);
				}
			});
		};

		toggle(this.hierarchy);
		this.groupState = { ...this.groupState };
	}

	protected handleLinkClick = (ev: Event, route: string) => {
		ev.preventDefault();

		if (location.hash === route)
			return;

		const { base } = this.siteConfig.env!;
		history.pushState({}, '', base + '#' + route);

		dispatchEvent(new HashChangeEvent('hashchange'));
	};

	protected handleToggleClick = (key: string) => {
		this.groupState = { ...this.groupState, [key]: !this.groupState[key] };
		this.element.dispatchEvent(new CustomEvent('toggle', { detail: { state: this.groupState } }));
	};

	protected handleHashChange = () => {
		const hash = location.hash.split('#').filter(Boolean).at(0) ?? '';
		this.activeHref = hash;
	};

	protected handleKeydown = (ev: KeyboardEvent) => {
		if (ev.code === 'Tab') {
			this.element.setAttribute('inert', '');
			setTimeout(() => this.element.removeAttribute('inert'), 0);
		}

		if (![ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ].includes(ev.code))
			return;

		const tabbableElements = tabbable(this.element, { getShadowRoot: true });
		const activeElement = findActiveElement(this.element) as HTMLElement | null;

		const indexOfActive = tabbableElements.findIndex(el => el === activeElement) ?? 0;
		let nextIndex = indexOfActive;
		let nextElement: FocusableElement | undefined;

		if (ev.code === 'ArrowUp') {
			ev.preventDefault();
			nextIndex = indexOfActive - 1;
			nextElement = tabbableElements.at(nextIndex);
		}
		if (ev.code === 'ArrowDown') {
			ev.preventDefault();
			nextIndex = (indexOfActive + 1) > tabbableElements.length - 1
				? 0
				: (indexOfActive + 1);

			nextElement = tabbableElements.at(nextIndex);
		}

		if ([ 'ArrowLeft', 'ArrowRight' ].includes(ev.code)) {
			if (activeElement?.classList.contains('toggle')) {
				const dataset = activeElement.dataset;
				const collapsed = dataset['collapsed'] === 'true' ? true : false;

				if (ev.code === 'ArrowLeft') {
					if (!collapsed) {
						activeElement.click();
					}
					else {
						nextElement = tabbableElements.slice(0, indexOfActive)
							.reverse()
							.find(el => el.classList.contains('toggle'));
					}
				}
				if (ev.code === 'ArrowRight') {
					if (collapsed) {
						activeElement.click();
					}
					else {
						nextElement = tabbableElements.slice(indexOfActive + 1)
							.find(el => el.classList.contains('toggle'));
					}
				}
			}
			else {
				if (ev.code === 'ArrowLeft') {
					nextElement = tabbableElements.slice(0, indexOfActive)
						.reverse()
						.find(el => el.classList.contains('toggle'));
				}
				if (ev.code === 'ArrowRight') {
					nextElement = tabbableElements.slice(indexOfActive)
						.find(el => el.classList.contains('toggle'));
				}
			}
		}

		if (nextElement)
			nextElement?.focus();
	};
	//#endregion


	//#region template
	protected groupTemplate = (group: TreeRecord): TemplateResult => {
		return html`
		${ map(
			Object.entries(group),
			([ dir, next ]: [string, Record<string, any> | string]) => {
				if (typeof next === 'string') {
					return html`
					<a
						tabindex="0"
						class   =${ classMap({ active: this.activeHref === next }) }
						href    =${ next }
						@click  =${ (ev: Event) => this.handleLinkClick(ev, next as string) }
					>
						${ dir }
					</a>
					`;
				}

				return html`
				<div class="group">
					<div class="heading" @click=${ () => this.handleToggleClick(dir) }>
						<label>
							${ dir }
						</label>
						<button class="toggle" data-collapsed=${ !this.groupState[dir] }>
							${ this.groupState[dir]
								? Icon(chevronDownIcon)
								: Icon(chevronRightIcon) }
						</button>
					</div>
					<div class="items">
						${ when(this.groupState[dir],
							() => this.groupTemplate(next as TreeRecord)) }
					</div>
				</div>
				`;
			},
		) }
		`;
	};

	public override render() {
		return this.groupTemplate(this.hierarchy);
	}
	//#endregion


	//#region styles
	public static override styles = [
		componentStyles,
		css`
		${ buttonStyle('button.toggle', 30, 20) }
		button.toggle:hover::after {
			display: none;
		}
		:host {
			display: flex;
			flex-flow: column nowrap;
			gap: 8px;
		}
		.group {
			display: flex;
			flex-flow: column nowrap;
		}
		.heading {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			font-size: 16px;
			font-weight: 600;
			cursor: pointer;
		}
		.items {
			position: relative;
			font-size: 14px;
			display: flex;
			flex-flow: column nowrap;
			padding-left: 16px;
		}
		.items::after {
			content: '';
			position: absolute;
			height: calc(100% - 2px);
			left: 7px;
			bottom: 0px;
			width: 2px;
			background-color: var(--midoc-tertiary-hover);
		}
		.heading,
		a {
			cursor: pointer;
			border-radius: var(--midoc-border-radius-s);
			text-transform: capitalize;
		}
		.heading {
			padding: 4px;
		}
		.heading label {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		a {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			text-decoration: none;
			color: unset;
			padding: 8px;
		}
		a.active {
			background-color: var(--midoc-tertiary-active);
		}
		.heading:hover,
		a:hover {
			background-color: var(--midoc-tertiary-hover);
		}
		a:active {
			background-color: var(--midoc-tertiary-press);
		}
		.heading:has(button:focus-visible),
		a:focus-visible {
			outline: 2px solid var(--midoc-tertiary-hover);
			outline-offset: -2px;
		}
		`,
	];

	static {
		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root.styleOverrides.pathTree;
		this.styles.push(unsafeCSS(style));
	}
	//#endregion

}


@customElement('midoc-path-tree')
export class PathTreeCmp extends AegisComponent {

	@property({ type: Array }) public paths: string[] = [];
	protected override adapter: PathTreeAdapter;

	constructor() {
		super(PathTreeAdapter);
	}

	public toggleAll(value: boolean) {
		this.adapter.toggleAll(value);
	}

}
