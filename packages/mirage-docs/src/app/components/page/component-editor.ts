import { ContainerLoader } from '@roenlie/lit-aegis';
import { css, html, LitElement, unsafeCSS, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import type { SiteConfig } from '../../../shared/config.types.js';
import { EsSourceEditor } from './source-editor.js';


@customElement('midoc-component-editor')
export class EsComponentEditor extends EsSourceEditor {

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

	public static override styles = [
		...EsSourceEditor.styles,
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
			border-top: 1px solid var(--midoc-surface-variant);
		}
		`,
	];

	static {
		const cfg = ContainerLoader.get<SiteConfig>('site-config');
		const style = cfg.root?.styleOverrides?.cmpEditor;
		if (style)
			this.styles.push(unsafeCSS(style));
	}

}


@customElement('midoc-editor-scratchpad')
export class EsEditorScratchpad extends LitElement {

	//#region properties
	@property({ type: Object, attribute: false }) public mixins: {
		connectedCallback?(): void;
		disconnectedCallback?(): void;
		render?(): string;
		styles?(): string;
	};
	//#endregion


	//#region lifecycle
	public override connectedCallback(): void {
		super.connectedCallback();
		this.mixins.connectedCallback?.apply(this);
	}

	public override disconnectedCallback(): void {
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
