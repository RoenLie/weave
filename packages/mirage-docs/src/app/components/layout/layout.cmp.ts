import { waitForPromises } from '@roenlie/core/async';
import { AdapterElement, customElement, query, state } from '@roenlie/custom-element/adapter';
import { classMap, html, when } from '@roenlie/custom-element/shared';

import type { SiteConfig } from '../../../shared/config.types.js';
import { container } from '../../container/container.js';
import { componentStyles } from '../../styles/component.styles.js';
import { toggleColorScheme } from '../../utilities/color-subscription.js';
import { debounce } from '../../utilities/debounce.js';
import { GlobalSearchCmp } from './global-search.cmp.js';
import { chevronUpIcon, Icon, listIcon, moonIcon, spinningCircleIcon, sunIcon } from './icons.js';
import { layoutStyles } from './layout.styles.js';
import { SidebarCmp } from './sidebar.cmp.js';

SidebarCmp.register();
GlobalSearchCmp.register();


@customElement('midoc-layout')
export class LayoutAdapter extends AdapterElement {

	//constructor() {
	//	super();

	//	const cfg = ContainerLoader.get<SiteConfig>('site-config');
	//	const style = cfg.root.styleOverrides.layout;

	//	const base = (this.constructor as typeof Adapter);
	//	if (Array.isArray(base.styles))
	//		base.styles.push(unsafeCSS(style));
	//}

	//#region properties
	@state()                protected loading = false;
	@query('iframe')        protected frameQry:      HTMLIFrameElement;
	@query('midoc-sidebar') protected sidebarQry:    AdapterElement;
	@query('.scrollback')   protected scrollbackQry: HTMLElement;

	protected activeFrame = '';
	protected transitionSet: Set<Promise<void>> = new Set();
	protected navClosedClass = 'nav--closed';
	protected navStorageProp = 'midocNavClosed';
	//#endregion


	//#region lifecycle
	override connected(): void {
		super.connected();

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

	override disconnected(): void {
		super.disconnected();

		window.removeEventListener('hashchange', this.handleHashChange);
	}
	//#endregion


	//#region logic
	protected handleHmrReload = debounce(() => this.startFrameReload(), 100);

	protected handleFrameLoad = () => {
		Object.assign(this.frameQry.style, { opacity: 1 });

		const contentWindow = this.frameQry?.contentWindow;
		if (contentWindow) {
			const hashPath = location.hash.slice(1);
			const [ _, hash ] = hashPath.split('#');
			if (!hash) {
				const scrollVal = Number(localStorage.getItem('pageScrollValue') ?? 0);
				contentWindow.scrollTo(0, scrollVal);
			}

			contentWindow.addEventListener('scroll', this.handleFramePageScroll);
			contentWindow.addEventListener('keydown', this.handleHotkeyPress);
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
		const promise: Promise<void> = new Promise(resolve => {
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
		let path = location.hash.slice(1);
		if (!path) {
			const { base } = container.get<SiteConfig>('site-config').env;
			const routes = container.get<string[]>('routes');

			path = routes[0] ?? '';
			history.replaceState({}, '', base + '#' + path);
		}

		if (this.activeFrame === path)
			return;

		const activeUrl = new URL(this.activeFrame, location.origin);
		const newUrl = new URL(path, location.origin);
		if (activeUrl.pathname === newUrl.pathname) {
			this.activeFrame = path;

			return;
		}

		this.requestUpdate();
		await this.updateComplete;

		this.startFrameReload();
	};

	protected startFrameReload = async () => {
		if (container.get<SiteConfig>('site-config').root.layout.clearLogOnReload)
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
		const path = location.hash.slice(1);
		if (path) {
			this.loading = true;
			this.activeFrame = path;

			const { base, libDir } = container.get<SiteConfig>('site-config').env;
			const frame = this.frameQry.cloneNode() as HTMLIFrameElement;

			const pathParts = path.split('#');
			if (!pathParts[0]!.endsWith('.html'))
				pathParts[0] = pathParts[0] + '.html';
			if (pathParts[1])
				pathParts[0] = pathParts[0] + '#' + pathParts[1];

			frame.src = [ base, libDir, pathParts[0] ].join('/').replaceAll(/\/+/g, '/');
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

			const searchEl = this.query<GlobalSearchCmp>('midoc-global-search');
			searchEl?.adapter.dialogQry.showModal();
		}
	};

	protected async setNavState(state?: boolean) {
		this.classList.toggle(this.navClosedClass, state);

		localStorage.setItem(
			this.navStorageProp,
			String(this.classList.contains(this.navClosedClass)),
		);

		if (!this.classList.contains(this.navClosedClass)) {
			this.sidebarQry?.addEventListener(
				'transitionend',
				() => {
					this.sidebarQry.query('input')?.focus();
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
	override render() {
		const { base } = container.get<SiteConfig>('site-config').env;

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
	static override styles = [
		componentStyles,
		layoutStyles,
	];
	//#endregion

}
