import { type Signal } from '@lit-labs/preact-signals';
import {
	Adapter,
	AegisComponent,
	customElement,
	inject,
	state,
} from '@roenlie/lit-aegis';
import { domId } from '@roenlie/mimic-core/dom';
import { forOf } from '@roenlie/mimic-core/iterators';
import { MMIcon } from '@roenlie/mimic-elements/icon';
import { tooltip } from '@roenlie/mimic-elements/tooltip';
import { sharedStyles } from '@roenlie/mimic-lit/styles';
import { html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';

import navStyles from './nav.css' with { type: 'css' };

MMIcon.register();


interface LinkBase { id: string; tooltip: string; icon: string; }
type Link = LinkBase & { path: string };
type Action = LinkBase & { action: () => any };


@customElement('m-nav')
export class NavCmp extends AegisComponent {

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

	constructor() {
		super(NavAdapter);
	}

}


export class NavAdapter extends Adapter {

	@inject('show-info-center') protected showInfoCenter: Signal<boolean>;
	@state() protected active: string;
	protected topLinks: (Link | Action)[] = [
		{
			id:      domId(),
			tooltip: 'forge',
			icon:    'https://icons.getbootstrap.com/assets/icons/sourceforge.svg',
			path:    router.urlForName('forge'),
		},
		{
			id:      domId(),
			tooltip: 'diary',
			icon:    'https://icons.getbootstrap.com/assets/icons/journal-richtext.svg',
			path:    router.urlForName('diary'),
		},
		{
			id:      domId(),
			tooltip: 'settings',
			icon:    'https://icons.getbootstrap.com/assets/icons/sliders2.svg',
			path:    router.urlForName('settings'),
		},
	];

	protected bottomLinks: (Link | Action)[] = [
		{
			id:      domId(),
			tooltip: 'help',
			icon:    'https://icons.getbootstrap.com/assets/icons/patch-question.svg',
			action:  () => {
				this.showInfoCenter.value = !this.showInfoCenter.value;
			},
		},
	];

	public override connectedCallback(): void {
		this.active = router.location.pathname;
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
			<mm-icon
				style=${ `view-transition-name:nav-${ link.id }` }
				url=${ link.icon }
			></mm-icon>
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
			${ tooltip(link.tooltip, { placement: 'right' }) }
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
			${ tooltip(link.tooltip, { placement: 'right' }) }
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

	public static override styles = [ sharedStyles, navStyles ];

}
