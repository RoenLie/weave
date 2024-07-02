import { Adapter, AegisComponent, customElement } from '@roenlie/lit-aegis';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { html } from 'lit';

import { ForgeFile } from '../../features/filesystem/forge-file.js';
import { MimicDB } from '../../features/filesystem/mimic-db.js';
import { EditorCmp } from '../../features/ide/editor.cmp.js';
import { ExplorerCmp } from '../../features/ide/explorer.cmp.js';
import forgeStyles from './forge.css' with { type: 'css' };
import { forgeModule } from './forge-module.js';

EditorCmp.register();
ExplorerCmp.register();

MimicDB.setup('forge-filesystem', setup => {
	setup
		.createCollection(ForgeFile, ForgeFile.dbIdentifier)
		.createIndex('id', 'id')
		.createIndex('name', 'name')
		.createIndex('path', 'path', { unique: true })
		.mutate(() => {});
});


@customElement('m-forge-page', true)
export class ForgePageCmp extends AegisComponent {

	constructor() { super(ForgePageAdapter, forgeModule); }
	public static page = true;
	public static override styles = sharedStyles;

}


export class ForgePageAdapter extends Adapter {

	public  override render(): unknown {
		return html`
		<s-primary-sidebar id="primary-sidebar" style="width:200px;">
			<m-explorer></m-explorer>
		</s-primary-sidebar>

		<s-workspace id="workspace">
			<m-editor></m-editor>
		</s-workspace>

		<s-panel id="panel">
		</s-panel>

		<s-secondary-sidebar id="secondary-sidebar">
		</s-secondary-sidebar>

		<s-status-bar id="status-bar">
		</s-status-bar>
		`;
	}

	public static override styles = forgeStyles;

}
