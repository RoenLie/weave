import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import { ContainerLoader } from '../../aegis/index.js';
import { SourceEditor } from './source-editor.js';


@customElement('midoc-component-editor')
export class ComponentEditor extends SourceEditor {

	constructor() {
		super();

		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root.styleOverrides.cmpEditor;

		const base = (this.constructor as typeof LitElement);
		if (style && Array.isArray(base.styles))
			base.styles.push(unsafeCSS(style));
	}

	protected override willUpdate(_changedProperties: PropertyValues): void {
		super.willUpdate(_changedProperties);

		if (_changedProperties.has('source')) {
			(async () => {
				try {
					const encodedJs = encodeURIComponent(this.source);
					const dataUri = `data:text/javascript;charset=utf-8,${ encodedJs }`;
					const module = await import(/* @vite-ignore */ dataUri);
					const mixins = module.default({ html, css });

					this.content = html``;
					await this.updateComplete;
					this.content = html`
					<midoc-editor-scratchpad .mixins=${ mixins }></midoc-editor-scratchpad>
					`;
				}
				catch (error) {
					console.warn('Import failed. Reason:', error);
				}

				this.requestUpdate();
			})();
		}
	}

	static override styles = [
		...SourceEditor.styles,
		css`
		:host {
			grid-template-rows: 1fr auto auto;
			border: none;
			padding-top: 50px;
		}
		.editor-section {
			resize: none;
			height: auto;
		}
		.resizer {
			border-top: 1px solid var(--midoc-outline);
		}
		`,
	];

}


@customElement('midoc-editor-scratchpad')
export class EditorScratchpad extends LitElement {

	//#region properties
	@property({ type: Object, attribute: false }) mixins: {
		connectedCallback?(): void;
		disconnectedCallback?(): void;
		render?(): string;
		styles?(): string;
	};
	//#endregion


	//#region lifecycle
	override connectedCallback(): void {
		super.connectedCallback();
		this.mixins.connectedCallback?.apply(this);
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.mixins.disconnectedCallback?.apply(this);
	}
	//#endregion


	//#region template
	protected override render() {
		const styles = unsafeHTML(`
		<style>${ this.mixins.styles?.apply(this) ?? '' }</style>
		`);

		const template = this.mixins.render?.apply(this);

		return html`
		${ styles ?? '' }
		${ template ?? '' }
		`;
	}
	//#endregion

}
