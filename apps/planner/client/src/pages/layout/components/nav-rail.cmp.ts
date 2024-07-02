import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { router } from '../../../app/routes/router.js';
import { componentStyles } from '../../../features/shared-styles/component-styles.js';
import('../../../components/text/text.cmp.js');
import('../../../components/ripple/ripple.cmp.js');


@customElement('pl-nav-rail')
export class NavRailCmp extends LitElement {

	@state() protected activeLink = '';
	@state() protected orientation: 'portrait' | 'landscape' = 'portrait';
	protected resizeObs: ResizeObserver;
	protected links = [
		{ text: 'home',     href: '/home',     icon: 'house' },
		{ text: 'calendar', href: '/calendar', icon: 'calendar4-week' },
		{ text: 'settings', href: '/settings', icon: 'gear' },
		{ text: 'reports',  href: '/reports',  icon: 'bar-chart-line' },
		{ text: 'profile',  href: '/profile',  icon: 'person' },
		{ text: 'demo',     href: '/demo',     icon: 'cone-striped' },
	];

	public override connectedCallback(): void {
		super.connectedCallback();

		this.resizeObs = new ResizeObserver(this.handleResize);
		this.resizeObs.observe(this);
		window.addEventListener('popstate', this.handlePopstate);

		this.handlePopstate();
	}

	public override disconnectedCallback(): void {
		super.connectedCallback();
		window.removeEventListener('popstate', this.handlePopstate);
		this.resizeObs.disconnect();
	}

	protected handlePopstate = () => {
		const path = location.pathname;
		this.activeLink = path;
	};

	protected handleResize = (entries: ResizeObserverEntry[]) => {
		const entry = entries[0]!;
		this.orientation = entry.contentRect.height >= entry.contentRect.width
			? 'portrait'
			: 'landscape';
	};

	protected linkTpl(text: string, href: string, icon: string) {
		return html`
		<pl-ripple speed=250>
			<button
				role="link"
				@click=${ () => router.navigate(href) }
				class=${ classMap({ link: true, active: this.activeLink.startsWith(href) }) }
			>
				<pl-text shadow>${ text }</pl-text>
				${ when(icon, () => html`
				<pl-boot-icon icon=${ icon } size="large"></pl-boot-icon>
				`) }
			</button>
		</pl-ripple>
		`;
	}

	protected override render() {
		return html`
		<div class=${ classMap({ base: true, [this.orientation]: true }) }>
			${ map(this.links, link => this.linkTpl(link.text, link.href, link.icon)) }
		</div>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
			height: 100%;
			place-items: center;
		}
		.base {
			display: flex;
			align-items: center;
			justify-content: space-evenly;
			gap: var(--spacing-m);
		}
		.base.portrait {
			flex-flow: column nowrap;
		}
		.base.landscape {
			flex-flow: row nowrap;
		}
		pl-ripple {
			border-radius: var(--border-radius-xl);
		}
		.link {
			position: relative;
			font-size: 14px;
			display: flex;
			flex-flow: column nowrap;
			align-items: center;
			justify-content: center;
			border-radius: var(--border-radius-xl);
			gap: var(--spacing-xs);
			aspect-ratio: 0.9;
			width: 65px;
			cursor: pointer;
			box-shadow: var(--box-shadow-s);
		}
		.link:focus-visible::after {
			content: '';
			inset: 0;
			position: absolute;
			outline: var(--focus-ring);
			outline-offset: var(--focus-offset);
			transition: var(--focus-transition);
			z-index: var(--focus-index);
			border-radius: inherit;
		}
		.link:active::after {
			outline-offset: 1px;
		}
		.link.active {
			background-color: var(--secondary-container);
			color: var(--on-secondary-container);
			box-shadow: var(--box-shadow-xs);
		}
		.link:hover {
			background-color: var(--secondary-container-hover);
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-nav-rail': NavRailCmp;
	}
}
