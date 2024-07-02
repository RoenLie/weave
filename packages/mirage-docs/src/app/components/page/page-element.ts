import { Adapter, AegisComponent, ContainerLoader, customElement } from '@roenlie/lit-aegis';
import { css, unsafeCSS } from 'lit';

import type { SiteConfig } from '../../../shared/config.types.js';
import { componentStyles } from '../../styles/component.styles.js';
import { highlightjsStyles } from '../../styles/highlightjs.styles.js';
import { markdownStyles } from '../../styles/markdown.styles.js';
import { anchorSnatcher } from '../../utilities/anchor-snatcher.js';
import { subscribeToColorChange } from '../../utilities/color-subscription.js';


export class PageAdapter extends Adapter {

	//#region properties
	public get colorScheme() {
		return document.documentElement.getAttribute('color-scheme');
	}
	//#endregion


	//#region observers
	protected resizeObserver = new ResizeObserver(([ entry ]) => {
		const height = entry!.contentRect.height;

		let stringValue = this.element.style.minHeight;
		if (!stringValue) {
			stringValue = height + 'px';
			this.element.style.setProperty('minHeight', Math.round(height) + 'px');
		}

		const previousMinHeight = Number(stringValue.replaceAll(/[^\\d.]/g, ''));

		if (height < previousMinHeight)
			this.element.style.removeProperty('minHeight');
		else
			this.element.style.setProperty('minHeight', Math.round(height) + 'px');
	});
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		subscribeToColorChange(this.element);
		this.resizeObserver.observe(this.element);

		anchorSnatcher.register();
		window.addEventListener('hashchange', this.handleHashChange);
	}

	public override disconnectedCallback() {
		anchorSnatcher.unregister();
		window.removeEventListener('hashchange', this.handleHashChange);
	}
	//#endregion


	//#region logic
	protected handleHashChange = () => {
		const hash = window.location.hash;
		const anchor = this.querySelector('a[href="' + hash + '"].header-anchor');
		anchor?.scrollIntoView({
			behavior: 'smooth',
			block:    'start',
			inline:   'start',
		});
	};
	//#endregion


	//#region template
	//#endregion


	//#region styles
	public static override styles = [
		componentStyles,
		highlightjsStyles,
		markdownStyles,
		css`
		:host {
			--code-font: Roboto Mono;

			display: block;
			min-height: 100vh;

			border-radius: 4px;
			padding-top: 50px;
			padding-inline: 24px;
		}
		.markdown-body {
			display: grid;
			background: none;
			padding-bottom: 200px;
		}
		.markdown-body pre {
			border: 1px solid var(--midoc-surface-variant);
		}
		.markdown-body pre code {
			font-family: var(--code-font);
		}
		`,
	];

	static {
		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root.styleOverrides.pageTemplate;
		this.styles.push(unsafeCSS(style));
	}
	//#endregion

}


@customElement('midoc-page')
export class PageElement extends AegisComponent {

	constructor() {
		super(PageAdapter);
	}

}
