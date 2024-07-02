import { iterate } from '@roenlie/mimic-core/iterators';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { when } from 'lit/directives/when.js';

import { MirageMDE } from '../mirage-mde.js';
import type { StatusBarItem } from '../registry/status-registry.js';


@customElement('mirage-mde-statusbar')
export class StatusbarElement extends LitElement {

	@property({ type: Object }) public scope: MirageMDE;
	@state() protected items: StatusBarItem[] = [];

	public create() {
		this.items = iterate(this.scope.registry.status)
			.pipe(([ name, item ]) => {
				if (this.scope.statusbar.includes(name))
					return item;
			})
			.toArray();
	}

	protected override render() {
		if (!this.scope)
			return;

		return html`
		${ map(this.items, (item) => {
			return html`
			<span>
				${ when(item.css, () => html`
				<style>
					${ item.css?.(item, this.scope.editor, this.scope) }
				</style>
				`) }
				${ unsafeHTML(item.template(item, this.scope.editor, this.scope)) }
			</span>
			`;
		}) }
		`;
	}

	public static override styles = [
		css`
		:host,
		* {
			box-sizing: border-box;
		}
		:host {
			display: grid;

			color: var(--_mmde-color);
			background-color: rgb(25, 34, 43);
			border: var(--_mmde-border);
			border-top: 1px solid rgb(30, 40, 50);
			border-bottom-left-radius: var(--_mmde-border-radius);
			border-bottom-right-radius: var(--_mmde-border-radius);

			padding-block: 4px;
			padding-inline: 10px;
			font-size: 12px;
			color: #959694;
			text-align: right;

			display: flex;
			flex-flow: row-reverse;
			align-items: center;
			min-height: 30px;
			gap: 1em;

		}
		span {
			display: inline-block;
			min-width: 4em;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mirage-mde-statusbar': StatusbarElement;
	}
}
