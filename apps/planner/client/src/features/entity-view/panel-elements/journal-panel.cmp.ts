import { EventOf } from '@roenlie/core/dom';
import { consume } from '@roenlie/lit-utilities/context';
import { $Container, injectableElement, injectProp } from '@roenlie/lit-utilities/injectable';
import { JournalEntry } from '@rotul/planner-entities';
import { Container } from 'inversify';
import { css, html } from 'lit';
import { query, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { map } from 'lit/directives/map.js';

import { JournalApi } from '../../../app/api/journal.js';
import { basicAlert } from '../../alerts/basic-alert.js';
import { componentStyles } from '../../shared-styles/component-styles.js';
import { $EntityView } from '../entity-context.js';
import { EntityPanelElement } from '../entity-panel-element.js';
import { EntityListStore, EntityPanelStore, EntityViewStore } from '../entity-view-store.js';


export const createJournalPanel = (options: {
	apiConfig: string | undefined,
}) => {
	return html`
	<pl-journal-panel
		api-config-id=${ ifDefined(options.apiConfig) }
	></pl-journal-panel>
	`;
};


@injectableElement('pl-journal-panel')
export class JournalPanelCmp extends EntityPanelElement {

	@injectProp($Container) protected container: Container;
	protected viewStore: EntityViewStore;
	protected listStore: EntityListStore;
	protected panelStore: EntityPanelStore;
	@consume('scope') protected scope: string;
	@state() protected journalEntries: JournalEntry[] = [];
	@state() protected message = '';
	@query('.read-wrapper') protected readQry: HTMLElement;

	public override connectedCallback() {
		super.connectedCallback();

		this.viewStore = this.container.getTagged<EntityViewStore>($EntityView, 'viewStore', this.scope);
		this.listStore = this.container.getTagged<EntityListStore>($EntityView, 'listStore', this.scope);
		this.panelStore = this.container.getTagged<EntityPanelStore>($EntityView, 'panelStore', this.scope);
	}

	public override async panelShow(): Promise<void> {
		this.getJournal();
	}

	public override async panelHide(): Promise<void> {

	}

	protected handleSendButtonClick() {
		this.newJournalEntry();
	}

	protected async getJournal() {
		const id = this.viewStore.selectedEntity.get(this)?.id;
		if (!id)
			return;

		let [ entries ] = await JournalApi.getAllDocumentEntries(id);
		this.journalEntries = entries ?? [];
	}

	protected async newJournalEntry() {
		const id = this.viewStore.selectedEntity.get(this)?.id;
		if (!id || !this.message.trim())
			return;

		const [ entries, error ] = await JournalApi.createChatEntry(id, this.message);
		if (entries) {
			this.journalEntries = entries;
			this.message = '';
			this.updateComplete.then(
				() => this.readQry.scrollTo({
					top:      this.readQry.scrollHeight,
					behavior: 'smooth',
				}),
			);
		}
		else if (error) {
			basicAlert('Error when writing to journal', 'error');
		}
	}

	protected override render() {
		return html`
		<div class="read-wrapper invert">
			<div class="read">
				${ map(this.journalEntries, entry => html`
				<div class="entry">
					<div>${ entry.createdBy }</div>
					<div>${ entry.message }</div>
				</div>
				`) }
			</div>
		</div>

		<div class="write">
			<textarea
				.value=${ live(this.message)  }
				@change=${ (ev: EventOf<HTMLTextAreaElement>) => this.message = ev.target.value }
			></textarea>
			<pl-button
				size="small"
				variant="primary"
				shape="rounded"
				@click=${ this.handleSendButtonClick.bind(this) }
			>Send</pl-button>
		</div>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			height: 100%;
			display: grid;
			grid-template-rows: 1fr auto;
		}
		.read-wrapper {
			display: flex;
			flex-flow: column nowrap;
			overflow: auto;
			gap: 12px;
			padding-inline: 32px;
			padding-block: 24px;
		}
		.read {
			display: flex;
			flex-flow: column nowrap;
			gap: 12px;
		}
		.invert {
			flex-direction: column-reverse;
		}
		.read .entry {
			display: grid;
			grid-template-rows: auto auto;
			grid-template-columns: auto;
			border: 1px solid var(--surface-variant);
			border-radius: var(--border-radius-m);
			width: fit-content;
			padding: 8px;
		}
		.write {
			position: relative;
			display: grid;
			height: 100px;
			border-top: 1px solid var(--surface-variant);
			padding: 8px 12px;
		}
		.write textarea {
			background-color: rgba(0,0,0,0.2);
			border-radius: var(--border-radius-m);
			padding: 4px 8px;
		}
		.write pl-button {
			position: absolute;
			bottom: 20px;
			right: 25px;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-journal-panel': JournalPanelCmp;
	}
}
