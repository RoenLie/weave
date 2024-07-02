import { MMButton } from '@roenlie/mimic-elements/button';
import { MMIcon } from '@roenlie/mimic-elements/icon';
import { MimicElement, customElement } from '@roenlie/mimic-lit/element';
import { css, html } from 'lit';
import { queryAssignedElements } from 'lit/decorators.js';

MMIcon.register();
MMButton.register();

@customElement('m-studio-tab-panel')
export class StudioTabPanel extends MimicElement {
	@queryAssignedElements({ slot: 'tab' }) protected tabs: HTMLElement[];

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected override render(): unknown {
		return html`
		<header>
			<s-tab-container>
				<slot name="tab"></slot>
			</s-tab-container>

			<m-studio-action-bar>
				<slot name="action"></slot>
				<slot slot="overflow" name="overflow"></slot>
			</m-studio-action-bar>
		</header>
		<section>
			<slot></slot>
		</section>
		`;
	}

	public static override styles = [
		css`
		:host {
			overflow: hidden;
			display: grid;
			grid-template-rows: max-content 1fr;
		}
		header {
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: 1fr;
			height: 60px;
			padding-inline: 10px;
			gap: 10px;
		}
		s-tab-container {
			overflow: auto;
			display: grid;
			grid-auto-flow: column;
			grid-auto-columns: max-content;
			gap: 10px;
		}
		s-tab-container {
			place-items: center;
		}
		slot[name="action"] {
			place-items: center;

			direction: rtl;
		}
		::slotted([slot="tab"]) {
			border-radius: 8px;
			padding: 10px;
			text-transform: capitalize;
			border: 1px solid transparent;
		}
		::slotted([slot="tab"]:hover) {
			background-color: var(--surface1);
		}
		::slotted([slot="tab"]:hover:not(:disabled)) {
			cursor: pointer;
		}
		::slotted([slot="tab"].active) {
			background-color: var(--surface);
			border-color: var(--background);
		}
		::slotted([slot="action"]) {
			all: unset;
    		direction: ltr;
			border-radius: 4px;
			padding: 6px;
			text-transform: capitalize;
			border: 1px solid var(--background);
			background-color: var(--surface1);
		}
		::slotted([slot="action"]:hover:not(:disabled)) {
			background-color: var(--background);
			cursor: pointer;
		}
		::slotted([slot="action"]:active:not(:disabled)) {
			background-color: var(--surface1);
		}
		m-studio-action-bar::part(popout) {
			border: 1px solid var(--background);
			background-color: var(--surface1);
			row-gap: 2px;
			min-width: 200px;
		}
		::slotted([slot="overflow"]) {
			all: unset;
    		direction: ltr;
			padding: 12px;
			text-transform: capitalize;
			background-color: var(--shadow1);
		}
		::slotted([slot="overflow"]:hover:not(:disabled)) {
			background-color: var(--surface1);
			cursor: pointer;
		}
		::slotted([slot="overflow"]:active:not(:disabled)) {
			background-color: var(--shadow1);
		}
		section {
			overflow: hidden;
			display: grid;
			background-color: var(--surface);
			border: 1px solid var(--background);
			border-radius: 8px;
		}
		`,
	];
}
