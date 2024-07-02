import { type EventOf, emitEvent } from '@roenlie/mimic-core/dom';
import { MimicElement, customElement } from '@roenlie/mimic-lit/element';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';

import { sharedStyles } from '../../features/styles/shared-styles.js';

@customElement('m-module-nav-selector')
export class ModuleNavSelector extends MimicElement {
	@property() public header = '';
	@property() public activeItem = '';
	@property({ type: Array }) protected items: { key: string; value: string }[] =
		[];

	protected override render(): unknown {
		return html`
		<header>
			<span>${this.header}</span>
		</header>

		<article>
			<ul @click=${(ev: EventOf<HTMLLIElement>) => {
				if (!(ev.target instanceof HTMLLIElement)) return;

				emitEvent(this, 'm-nav-select-key', { detail: ev.target.id });
			}}>
				${map(
					this.items,
					item => html`
					<li
						id=${item.key}
						class=${classMap({ active: this.activeItem === item.key })}
					>${item.value}</li>
					`,
				)}
			</ul>
		</article>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: grid;
			overflow: hidden;
			grid-template-rows: max-content 1fr;
			background-color: var(--shadow1);
		}
		header {
			overflow: hidden;
			display: flex;
			place-items: center start;
			height: 40px;
			padding-inline: 20px;
		}
		header span {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		article {
			overflow: hidden;
			display: grid;
			background-color: var(--surface);
			border-radius: 8px;
			border: 1px solid var(--background);
			padding: 2px;
		}
		ul {
			display: grid;
			grid-auto-rows: max-content;
			overflow: hidden;
			overflow-y: auto;
		}
		ul::-webkit-scrollbar-thumb {
			border-top-right-radius: 8px;
			border-bottom-right-radius: 8px;
		}
		li.active {
			background-color: var(--surface1);
		}
		`,
	];
}

declare global {
	interface HTMLElementTagNameMap {
		'm-nav-select-key': ModuleNavSelector;
	}
	interface HTMLElementEventMap {
		'm-nav-select-key': CustomEvent<string>;
	}
}
