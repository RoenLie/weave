import { domId } from '@roenlie/core/dom';
import { forOf } from '@roenlie/core/iterators';
import { css, html, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';

import { customElement, state } from 'lit/decorators.js';


interface LinkBase { id: string; tooltip: string; icon: string; }
type Link = LinkBase & { path: string };
type Action = LinkBase & { action: () => any };


@customElement('f-nav')
export class NavCmp extends LitElement {

	static {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(`
			::view-transition-group(activenav) {
				animation-duration: 300ms;
				animation-timing-function: ease-out;
			}
		`);

		document.adoptedStyleSheets = [ ...document.adoptedStyleSheets, sheet ];
	}

	@state() protected active: string;
	protected topLinks: (Link | Action)[] = [
		{
			id:      domId(),
			tooltip: 'forge',
			icon:    'https://icons.getbootstrap.com/assets/icons/sourceforge.svg',
			path:    '1',
		},
		{
			id:      domId(),
			tooltip: 'diary',
			icon:    'https://icons.getbootstrap.com/assets/icons/journal-richtext.svg',
			path:    '2',
		},
		{
			id:      domId(),
			tooltip: 'settings',
			icon:    'https://icons.getbootstrap.com/assets/icons/sliders2.svg',
			path:    '3',
		},
	];

	protected bottomLinks: (Link | Action)[] = [
		{
			id:      domId(),
			tooltip: 'help',
			icon:    'https://icons.getbootstrap.com/assets/icons/patch-question.svg',
			action:  () => {
			},
		},
	];

	public override connectedCallback(): void {
		super.connectedCallback();

		this.active = this.topLinks[1]!.path;
	}

	protected handleClickNav(ev: MouseEvent) {
		const id = (ev.currentTarget as HTMLElement).id;
		if (this.active === id)
			return;

		const link = forOf(this.topLinks, this.bottomLinks)
			.find(l => 'path' in l ? l.path === id : l.id === id)!;

		if (!('path' in link))
			return;

		document.startViewTransition?.(async () => {
			this.active = id;
			await this.updateComplete;
		});
	}

	protected handleClickAction(ev: MouseEvent) {
		const id = (ev.currentTarget as HTMLElement).id;
		const link = forOf(this.topLinks, this.bottomLinks)
			.find(l => 'path' in l ? l.path === id : l.id === id)!;
		if ('action' in link)
			link.action();
	}

	protected renderItem(link: Link | Action) {
		return html`
		<s-nav-item class=${ classMap({ active: this.active === link.id }) }>
			<img
				style=${ `view-transition-name:nav-${ link.id }` }
				src=${ link.icon }
			></img>
		</s-nav-item>
		`;
	}

	protected renderLink(link: Link) {
		return html`
		<a
			id=${ link.path }
			href=${ link.path }
			style=${ this.active === link.path ? 'view-transition-name:activenav;' : '' }
			class=${ classMap({ active: this.active === link.path }) }
			@click=${ this.handleClickNav.bind(this) }
		>
			${ this.renderItem(link) }
		</a>
		`;
	}

	protected renderAction(link: Action) {
		return html`
		<a
			id=${ link.id }
			style=${ this.active === link.id ? 'view-transition-name:activenav;' : '' }
			class=${ classMap({ active: this.active === link.id }) }
			@click=${ this.handleClickAction.bind(this) }
		>
			${ this.renderItem(link) }
		</a>
		`;
	}

	public override render(): unknown {
		return html`
		<s-link-wrapper>
			${ map(this.topLinks, link =>
				'path' in link ? this.renderLink(link) : this.renderAction(link)) }
		</s-link-wrapper>

		<s-link-wrapper>
			${ map(this.bottomLinks, link =>
				'path' in link ? this.renderLink(link) : this.renderAction(link)) }
		</s-link-wrapper>
		`;
	}

	public static override styles = css`
	:host {
		--_active-bg: rgb(30, 30, 30);
		--_border-radius: 16px;

		overflow: hidden;
		display: grid;
		grid-template-rows: 1fr max-content;
		gap: 22px;
		padding-block: 12px;
		padding-right: 8px;
		background-color: rgb(55, 55, 55);
	}
	s-link-wrapper {
		display: grid;
		grid-auto-flow: row;
		grid-auto-rows: max-content;
		gap: 22px;
	}
	a {
		position: relative;
		display: block;

		&.active {
			pointer-events: none;

			s-nav-item {
				background: var(--_active-bg);
			}
			s-nav-item::before,
			s-nav-item::after {
				content: '';
				position: absolute;
				width: var(--_border-radius);
				height: var(--_border-radius);
				left: 0;
				background: transparent;
			}
			s-nav-item::before {
				top: calc(var(--_border-radius) * -1);
				border-radius: 0 0 0 999px;
				box-shadow: -4px 4px 0 4px var(--_active-bg);
			}
			s-nav-item::after {
				bottom: calc(var(--_border-radius) * -1);
				border-radius: 999px 0 0 0;
				box-shadow: -4px -4px 0 4px var(--_active-bg);
			}
		}

	}
	s-nav-item {
		cursor: pointer;
		display: flex;
		justify-content: center;
		border-top-right-radius: var(--_border-radius);
		border-bottom-right-radius: var(--_border-radius);
		padding: 8px 12px;
		padding-right: 8px;
	}
	`;

}
