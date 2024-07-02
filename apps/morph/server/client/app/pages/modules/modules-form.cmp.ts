import '../../components/spinner.cmp.ts';

import { SignalWatcher } from '@lit-labs/preact-signals';
import { css, html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { when } from 'lit/directives/when.js';

import { type IModule, Module } from '../../../../models/modules-model.ts';
import { insertModule } from '../../database/insert-module.ts';
import { updateModule } from '../../database/update-module.ts';
import { subOnce } from '../../utilities/signals.ts';
import type { ModulesStore } from './modules-store.ts';


interface Field { key: keyof IModule; hidden?: true; type: 'input' | 'checkbox' }


@customElement('m-modules-form')
export class ModulesForm extends SignalWatcher(LitElement) {

	@property({ type: Object }) protected store: ModulesStore;
	@state() protected loadingEditor: Promise<any> | undefined;
	@state() protected fields: Field[] = [
		{ key: 'module_id', type: 'input', hidden: true },
		{ key: 'namespace', type: 'input' },
		{ key: 'name', type: 'input' },
		{ key: 'description', type: 'input' },
		{ key: 'active', type: 'checkbox' },
	];

	@query('form') protected formEl?: HTMLFormElement;

	public override connectedCallback() {
		super.connectedCallback();

		subOnce(this.store.selectedModule, () => {
			this.loadingEditor = import('@roenlie/monaco-editor-wc')
				.then(() => this.loadingEditor = undefined);
		});
	}

	public async onSave() {
		const module = await updateModule(this.getFormModule(), true);
		if (module) {
			this.store.selectedModule.value = module;
			this.dispatchEvent(new Event('reload-items'));
		}
	}

	public async onInsert() {
		const newModule = await insertModule(this.getFormModule(), true);
		if (newModule) {
			this.store.selectedModule.value = newModule;
			this.dispatchEvent(new Event('reload-items'));
		}
		else {
			alert('Failed to delete the module');
		}
	}

	public async onDelete() {
		const shouldDelete = confirm('Are you sure you wish to delete this module?');
		if (!shouldDelete)
			return;

		const response = await fetch('/api/modules/delete', {
			method:  'post',
			headers: {
				'Content-Type': 'Application/Json',
			},
			body: this.getFormModule().toString(),
		});

		if (response.status === 200) {
			this.store.selectedModule.value = undefined;
			this.dispatchEvent(new Event('reload-items'));
		}
		else {
			alert('Failed to delete the module');
		}
	}

	protected getFormModule(): Module {
		const data: Record<keyof any, any> = {};
		for (const [ key, value ] of new FormData(this.formEl))
			data[key] = value;

		return Module.parse(data as IModule);
	}

	protected override render() {
		const { value: selected } = this.store.selectedModule;

		if (!selected) {
			return html`
			<span style="place-self:center;">
				Select file to start editing.
			</span>
			`;
		}

		return html`
		<form @submit=${ (ev: Event) => { ev.preventDefault(); } }>
			<div class="inputs">
				${ this.fields.map(field => html`
				<label style=${ field.hidden ? 'display:none;' : '' }>
					<span>${ field.key }</span>
					${ field.type === 'input' ? html`
					<input
						name="${ field.key }"
						.value="${ live(String(selected?.[field.key] ?? '')) }"
					>
					` : html`
					<input
						name="${ field.key }"
						type="checkbox"
						?checked=${ !!selected?.[field.key] }
						.value="${ live(String(selected?.[field.key] ?? '')) }"
					>
					` }
				</label>
				`) }
			</div>

			<div class="actions">
				${ selected?.module_id ? html`
				<button @click=${ this.onSave }>
					Save
				</button>

				<button @click=${ this.onDelete }>
					Delete
				</button>
				` : html`
				<button @click=${ this.onInsert }>
					Insert
				</button>
				` }
			</div>

			${ when(this.loadingEditor, () => html`
			<s-loader>
				<m-spinner></m-spinner>
				<span>loading editor</span>
			</s-loader>
			`, () => html`
			<monaco-editor
				id="code"
				name="code"
				language="typescript"
				.value=${ selected?.code ?? '' }
			></monaco-editor>
			`) }
		</form>
		`;
	}

	public static override styles = css`
	:host {
		overflow: hidden;
		display: grid;
	}
	form {
		position: relative;
		overflow: hidden;
		display: grid;
		grid-template-columns: 1fr max-content;
		grid-template-rows: max-content 1fr;
		row-gap: 8px;
	}
	.inputs {
		display: grid;
		gap: 8px;
		grid-template-columns: max-content 1fr;

		& label {
			grid-column: span 2;
			display: grid;
			grid-template-columns: subgrid;
			align-items: center;
		}

		[type="checkbox"] {
			justify-self: start;
		}

	}
	.actions {
		border-left: 2px solid white;
	}
	.inputs, .actions {
		padding-top: 24px;
		padding-bottom: 8px;
		padding-inline: 24px;
		border-bottom: 2px solid white;
	}
	s-loader {
		position: absolute;
		place-self: center;
	}
	monaco-editor {
		grid-column: span 2;
	}
	`;

}
