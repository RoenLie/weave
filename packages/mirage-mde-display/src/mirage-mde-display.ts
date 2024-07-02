import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import codeDarkStyles from './styles/code-dark.css?inline';
import markdownStyles from './styles/markdown.css?inline';
import markdownTokens from './styles/markdown-tokens.css?inline';


@customElement('mirage-mde-display')
export class DisplayElement extends LitElement {

	@property({ reflect: true }) public theme: 'light' | 'dark' = 'dark';
	@property() public content = '';
	@property() public styles = '';

	protected override render() {
		return html`
		<div
			part="markdown-body"
			class=${ classMap({ 'markdown-body': true, [this.theme]: true }) }
		>
			${ unsafeHTML(this.content) }
		</div>

		<style>
			${ this.styles }
		</style>
		`;
	}

	public static override styles = [
		unsafeCSS(markdownTokens),
		unsafeCSS(markdownStyles),
		unsafeCSS(codeDarkStyles),
		css`
		:host, * {
			box-sizing: border-box;
		}
		:host {
			display: grid;
		}
		.markdown-body {
			padding: 4px;
			word-break: break-word;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mirage-mde-display': DisplayElement;
	}
}
