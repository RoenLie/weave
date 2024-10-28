import { Adapter, AegisComponent, ContainerLoader, customElement, query, state } from '@roenlie/lit-aegis';
import { html, LitElement, unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import { componentStyles } from '../../styles/component.styles.js';
import { debounce } from '../../utilities/debounce.js';
import { GlobalSearchCmp } from './global-search.cmp.js';
import {
	chevronUpIcon, Icon, listIcon,
	moonIcon, spinningCircleIcon, sunIcon,
} from './icons.js';
import { layoutStyles } from './layout.styles.js';
import { SidebarCmp } from './sidebar.cmp.js';
import { waitForPromises } from '@roenlie/core/async';
import { toggleColorScheme } from '../../utilities/color-subscription.js';

SidebarCmp.register();
GlobalSearchCmp.register();


@customElement('midoc-layout')
export class LayoutCmp extends AegisComponent {

	constructor() {
		super(LayoutAdapter);
	}

}


export class LayoutAdapter extends Adapter {

	constructor() {
		super();

		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root.styleOverrides.layout;

		const base = (this.constructor as typeof Adapter);
		if (Array.isArray(base.styles))
			base.styles.push(unsafeCSS(style));
	}

	//#region properties
	@state() protected loading = false;
	@query('iframe') protected frameQry:           HTMLIFrameElement;
	@query('midoc-sidebar') protected sidebarQry:  LitElement;
	@query('.scrollback') protected scrollbackQry: HTMLElement;

	protected activeFrame = '';
	protected transitionSet = new Set<Promise<void>>();
	protected navClosedClass = 'nav--closed';
	protected navStorageProp = 'midocNavClosed';
	//#endregion


	//#region lifecycle
	public override connectedCallback(): void {
		this.handleHashChange();
		this.handleNavToggle(true);

		this.updateComplete.then(() => {
			window.addEventListener('message', (ev) => {
				if (ev.origin !== location.origin)
					return;

				if (ev.data === 'hmrReload')
					this.handleHmrReload();
			});

			window.addEventListener('hashchange', this.handleHashChange, { passive: true });
		});
	}

	public override disconnectedCallback(): void {
		window.removeEventListener('hashchange', this.handleHashChange);
	}
	//#endregion


	//#region logic
	protected handleHmrReload = debounce(() => this.startFrameReload(), 100);

	protected handleFrameLoad = () => {
		Object.assign(this.frameQry.style, { opacity: 1 });

		if (this.frameQry) {
			const contentWindow   = this.frameQry.contentWindow;

			if (contentWindow) {
				const scrollVal = Number(localStorage.getItem('pageScrollValue') ?? 0);
				contentWindow.scrollTo(0, scrollVal);

				contentWindow.addEventListener('scroll', this.handleFramePageScroll);
				contentWindow.addEventListener('keydown', this.handleHotkeyPress);
			}
		}

		this.loading = false;
	};

	protected handleFramePageScroll = () => {
		const frameWindow = this.frameQry.contentWindow;
		const scrollValue = frameWindow?.scrollY;
		if (!scrollValue)
			return;

		localStorage.setItem('pageScrollValue', String(scrollValue));
		if (scrollValue > frameWindow.innerHeight) {
			if (this.scrollbackQry.classList.contains('hidden'))
				this.scrollbackQry.classList.remove('hidden');
		}
		else {
			if (!this.scrollbackQry.classList.contains('hidden'))
				this.scrollbackQry.classList.add('hidden');
		}
	};

	protected blockTransition = () => {
		const promise = new Promise<void>(resolve => {
			this.frameQry.addEventListener(
				'transitionend',
				() => {
					this.transitionSet.delete(promise);
					resolve();
				},
				{ once: true },
			);

			Object.assign(this.frameQry.style, { opacity: 1 });
		});

		return promise;
	};

	protected handleHashChange = async (_ev?: HashChangeEvent) => {
		let hash = location.hash.slice(1);
		if (!hash) {
			const { base } = ContainerLoader.get<SiteConfig>('site-config').env;
			const routes = ContainerLoader.get<string[]>('routes');

			hash = routes[0] ?? '';
			history.replaceState({}, '', base + '#' + hash);
		}

		if (this.activeFrame === (hash + '.html'))
			return;

		this.requestUpdate();
		await this.updateComplete;

		this.startFrameReload();
	};

	protected startFrameReload = async () => {
		if (ContainerLoader.get<SiteConfig>('site-config').root.layout.clearLogOnReload)
			console.clear();

		await waitForPromises(this.transitionSet);

		if (this.activeFrame === '')
			return this.handleTransitionEnd();

		if (this.frameQry.style.opacity === '0')
			return this.transitionSet.add(this.blockTransition());

		this.frameQry.contentWindow
			?.removeEventListener('scroll', this.handleFramePageScroll);
		this.frameQry.contentWindow
			?.removeEventListener('keydown', this.handleHotkeyPress);

		this.frameQry.addEventListener('transitionend',
			this.handleTransitionEnd, { once: true });

		this.frameQry.style.setProperty('opacity', '0');
	};

	protected handleTransitionEnd = () => {
		const hash = location.hash.slice(1);
		if (hash) {
			this.loading = true;
			this.activeFrame = hash + '.html';

			const { base, libDir } = ContainerLoader.get<SiteConfig>('site-config').env;
			const frame = this.frameQry.cloneNode() as HTMLIFrameElement;
			frame.src = [ base, libDir, this.activeFrame ].join('/').replaceAll(/\/+/g, '/');
			frame.classList.toggle('active', true);

			this.frameQry.replaceWith(frame);
			this.frameQry.addEventListener('load', this.handleFrameLoad, { once: true });
		}
		else {
			this.loading = false;
			Object.assign(this.frameQry.style, { opacity: 1 });
		}
	};

	protected handleColorSchemeToggle() {
		toggleColorScheme();
		this.startFrameReload();
	}

	protected handleHotkeyPress = (ev: KeyboardEvent) => {
		if (ev.code === 'KeyP' && (ev.ctrlKey || ev.metaKey)) {
			ev.preventDefault();

			const searchEl = this.querySelector<GlobalSearchCmp>('midoc-global-search');
			searchEl?.adapter.dialogQry.showModal();
		}
	};

	protected async setNavState(state?: boolean) {
		this.element.classList.toggle(this.navClosedClass, state);

		localStorage.setItem(
			this.navStorageProp,
			String(this.element.classList.contains(this.navClosedClass)),
		);

		if (!this.element.classList.contains(this.navClosedClass)) {
			this.sidebarQry?.addEventListener(
				'transitionend',
				() => {
					this.sidebarQry.renderRoot.querySelector('input')?.focus();
				},
				{ once: true },
			);
		}
	}

	protected handleNavToggle(reset?: boolean) {
		if (reset) {
			const state = (localStorage.getItem(this.navStorageProp) ?? false) === 'true';
			this.setNavState(state);
		}
		else {
			this.setNavState();
		}
	}

	protected handleScrollback() {
		this.frameQry.contentDocument?.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
	}
	//#endregion


	//#region template
	public override render() {
		const { base } = ContainerLoader.get<SiteConfig>('site-config').env;

		return html`
		<midoc-sidebar></midoc-sidebar>

		<main>
			<div class="header">
				<div class="start">
					<div class="nav-toggle">
						<button class="toggle" @click=${ () => this.handleNavToggle() }>
							${ Icon(listIcon) }
						</button>
					</div>
				</div>

				<div class="middle">
					<midoc-global-search></midoc-global-search>
				</div>

				<div class="end">
					<div class="theme-toggle">
						<button class="toggle" @click=${ () => this.handleColorSchemeToggle() }>
						${ document.documentElement.getAttribute('color-scheme') === 'light'
							? Icon(sunIcon)
							: Icon(moonIcon) }
						</button>
					</div>
				</div>
			</div>

			<section>
				<iframe
					class=${ classMap({ active: !!this.activeFrame }) }
					src=${ this.activeFrame ? base + this.activeFrame : '' }
				></iframe>
			</section>

			${ when(this.loading, () => html`
				<div class="loader">
					${ Icon(spinningCircleIcon) }
				</div>
				`) }
		</main>

		<div class=${ classMap({
			scrollback: true,
			hidden:     (this.frameQry?.contentWindow?.scrollY ?? 0)
				< (this.frameQry?.contentWindow?.innerHeight ?? 800),
		}) }>
			<button class="toggle" @click=${ () => this.handleScrollback() }>
				${ Icon(chevronUpIcon) }
			</button>
		</div>
		`;
	}
	//#endregion


	//#region styles
	public static override styles = [
		componentStyles,
		layoutStyles,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'midoc-layout': LayoutCmp;
	}
}
