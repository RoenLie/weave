import { css } from 'lit';

import type { SiteConfig } from '../../../shared/config.types.js';
import { Adapter, AegisComponent, ContainerLoader, customElement } from '../../aegis/index.js';
import { componentStyles } from '../../styles/component.styles.js';
import { highlightjsStyles } from '../../styles/highlightjs.styles.js';
import { markdownStyles } from '../../styles/markdown.styles.js';
import { markdownTokens } from '../../styles/markdown-tokens.styles.js';
import { anchorSnatcher } from '../../utilities/anchor-snatcher.js';
import { subscribeToColorChange } from '../../utilities/color-subscription.js';
import { MiDocCopyCodeCmp } from './copy-code.js';

MiDocCopyCodeCmp.register();


@customElement('midoc-page')
export class PageElement extends AegisComponent {

	protected static firstLoad = true;

	constructor() {
		super(PageAdapter);

		if (PageElement.firstLoad) {
			PageElement.firstLoad = false;
			const cfg = ContainerLoader.get<SiteConfig>('site-config');
			const style = cfg.root.styleOverrides.pageTemplate;

			const stylesheet = new CSSStyleSheet();
			stylesheet.replaceSync(style);

			PageElement.stylesheets.push(stylesheet);
		}
	}

	static stylesheets = [
		componentStyles,
		highlightjsStyles,
		markdownTokens,
		markdownStyles,
		css`
		midoc-page {
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
			border: 1px solid var(--midoc-outline);
		}
		.markdown-body pre code {
			font-family: var(--code-font);
		}
		`,
	].map(style => {
		const sheet = new CSSStyleSheet();
		sheet.replaceSync(style.cssText);

		return sheet;
	});

	protected override createRenderRoot() {
		document.adoptedStyleSheets = [
			...new Set([
				...document.adoptedStyleSheets,
				...PageElement.stylesheets,
			]),
		];

		return this;
	}

}


export class PageAdapter extends Adapter {

	//#region properties
	get colorScheme() {
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
	override connectedCallback() {
		subscribeToColorChange(this.element);
		this.resizeObserver.observe(this.element);

		anchorSnatcher.register();
		window.addEventListener('hashchange', this.handleHashChange);
	}

	override afterConnectedCallback(): void {
		this.handleHashChange();
	}

	override disconnectedCallback() {
		anchorSnatcher.unregister();
		window.removeEventListener('hashchange', this.handleHashChange);
	}
	//#endregion


	//#region logic
	protected handleHashChange = () => {
		const hash = window.location.hash;
		const anchor = document.querySelector('a[href="' + hash + '"].header-anchor');
		anchor?.scrollIntoView({
			behavior: 'smooth',
			block:    'start',
			inline:   'center',
		});
	};
	//#endregion

}
