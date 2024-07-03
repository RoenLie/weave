import { type EventOf, emitEvent } from '@roenlie/core/dom';
import { MimicElement, customElement } from '@roenlie/lit-utilities/element';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';

import { sharedStyles } from '../../features/styles/shared-styles.js';

/**
 * @csspart tab - the tab element.
 * @csspart tabs - container for tabs.
 * @fires m-tab-click emitted when clicking on a tab, detail contains the tab key.
 */
@customElement('m-editor-tabs')
export class EditorTabs extends MimicElement {
	@property() public activeTab = '';
	@property({ type: Array }) public tabs: { key: string; value: string }[] = [];
	@property({ reflect: true }) public direction: 'vertical' | 'horizontal' =
		'horizontal';
	@property({ reflect: true }) public placement: 'start' | 'end' = 'end';

	protected onTabClick(ev: EventOf) {
		const tab = (ev.composedPath() as HTMLElement[]).find(
			el => el.tagName === 'S-TAB',
		);

		emitEvent(this, 'm-tab-click', { detail: tab?.id });
	}

	protected override render(): unknown {
		return html`
		<s-tabs
			part="tabs"
			id="tabs"
		>
			${map(
				this.tabs,
				({ key, value }) => html`
			<s-tab
				part="tab"
				id=${key}
				class=${classMap({ active: key === this.activeTab })}
				@click=${this.onTabClick}
			>
				<span>${value}</span>
			</s-tab>
			`,
			)}

			<m-virtual-scrollbar
				horizontal-scroll
				direction="horizontal"
				placement="end"
				.reference=${this.updateComplete.then(() =>
					this.renderRoot.querySelector('#tabs'),
				)}
			></m-virtual-scrollbar>
		</s-tabs>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			--_border-top:            var(--m-border-top,           initial);
			--_border-right:          var(--m-border-right,         initial);
			--_border-bottom:         var(--m-border-bottom,        initial);
			--_border-left:           var(--m-border-left,          initial);
			--_tab-background:        var(--m-tab-background,       initial);
			--_active-border-top:     var(--m-active-border-top,    initial);
			--_active-border-right:   var(--m-active-border-right,  initial);
			--_active-border-bottom:  var(--m-active-border-bottom, initial);
			--_active-border-left:    var(--m-active-border-left,   initial);
			--_active-tab-background: var(--m-active-tab-background,initial);
		}
		`,
		css`
		:host([direction="vertical"]) s-tabs {
			grid-auto-flow: row;
			overflow-x: hidden;
			overflow-y: scroll;
			min-width: 100px;
		}
		:host([direction="vertical"]) s-scrollbar {
			overflow-x: hidden;
			overflow-y: scroll;
		}
		:host([direction="vertical"]) s-scrollthumb {
			width: 1px;
		}
		:host([direction="vertical"]) s-tab {
			margin-bottom: -3px;
		}
		:host([direction="vertical"]) s-tab:first-of-type {
			border-top: none;
		}
		:host([direction="vertical"]) s-tab:last-of-type {
			border-bottom: none;
		}
		:host([direction="horizontal"]) s-tab {
			margin-right: -3px;
		}
		:host([direction="horizontal"]) s-tab:first-of-type {
			border-left: none;
		}
		:host([direction="horizontal"]) s-tab:last-of-type {
			border-right: none;
		}
		:host {
			overflow: hidden;
			display: grid;
		}
		s-tabs {
			position: relative;
			display: grid;
			grid-auto-flow: column;
			grid-auto-rows: max-content;
			grid-auto-columns: max-content;
			min-height: 40px;
			font-size: 12px;
			overflow: hidden;
			overflow-x: scroll;
		}
		s-tab {
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			padding-inline: 8px;
			height: 40px;
			min-width: 100px;
			max-width: 150px;
			overflow: hidden;
			border-top: var(--_border-top);
			border-right: var(--_border-right);
			border-bottom: var(--_border-bottom);
			border-left: var(--_border-left);
			background-color: var(--_tab-background);
		}
		s-tab span {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		s-tab.active {
			border-top: var(--_active-border-top);
			border-right: var(--_active-border-right);
			border-bottom: var(--_active-border-bottom);
			border-left: var(--_active-border-left);
			background-color: var(--_active-tab-background);
		}
		`,
	];
}
