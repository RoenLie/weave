import { AegisElement, customElement } from '@roenlie/lit-aegis';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { map } from 'lit/directives/map.js';

import { CreateFields } from '../field-config/field-config.js';
import { ForgeFile, ForgeFileDB } from '../filesystem/forge-file.js';
import { MimicDB } from '../filesystem/mimic-db.js';


@customElement('m-file-details')
export class FileDetailsCmp extends AegisElement {

	@property() public activeId?: string;
	@state() protected file?: ForgeFile;
	protected config: FieldType[] = [];

	protected override willUpdate(props: Map<PropertyKey, unknown>): void {
		super.willUpdate(props);

		if (props.has('activeId'))
			this.getFile();

		if (props.has('file')) {
			this.config = CreateFields.input({
				label: 'name',
				value: this.file?.name,
			}).select({
				label:   'type',
				value:   this.file?.type,
				options: [
					{
						key:         'script',
						value:       'script',
						description: 'script',
					},
					{
						key:         'component',
						value:       'component',
						description: 'component',
					},
				],
			}).build();
		}
	}

	protected async getFile() {
		if (!this.activeId)
			return this.file = undefined;

		this.file = await MimicDB
			.connect(ForgeFileDB)
			.collection(ForgeFile)
			.get(this.activeId);
	}

	protected override render(): unknown {
		const setValue = (event: Event, field: FieldType) => {
			const target = event.currentTarget as unknown as {value: any};
			field.value = target.value;

			console.log(this.config);
		};

		return html`
		<form>
		${ map(this.config, (field) => {
			if (CreateFields.isInput(field)) {
				return html`
				<label for=${ field.label }>
					<span>${ field.label }</span>
					<input
						id=${ field.label }
						.value=${ live(field.value) }
						@change=${ (ev: Event) => setValue(ev, field) }
					></input>
				</label>
				`;
			}
			if (CreateFields.isSelect(field)) {
				return html`
				<label for=${ field.label }>
					${ field.label }
					<select
						id=${ field.label }
						.value=${ live(field.value) }
						@change=${ (ev: Event) => setValue(ev, field) }
					>
						${ map(field.options, option => html`
						<option .value=${ option.value }>
							${ option.description ?? option.key ?? option.value }
						</option>
						`) }
					</select>
				</label>
				`;
			}

			return nothing;
		}) }
		</form>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: block;
			padding: 8px;
		}
		form {
			display: grid;
			grid-template-columns: max-content 1fr;
			gap: 8px;
		}
		label {
			display: grid;
			grid-template-columns: subgrid;
			grid-column: 1/3;
			gap: 8px;
		}
		`,
	];

}
