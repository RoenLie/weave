
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.js';
import { PageAdapter } from '@roenlie/mirage-docs/app/components/page/page-element.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js'
// injected imports
import '/../docs/pages/upload/upload.demo.ts';
import '@roenlie/mirage-docs/app/components/page/page-header.js';
// hoisted


class hpxzxvjxbu extends PageAdapter {

	//#region properties
	protected examples: Record<string, string> = {};
	protected metadata: Record<string, any> = {};
	//#endregion

	//#region template
	public override render() {
		return html`
			<div id="page-start" style="display:none;"></div>
			<div class="markdown-body" color-scheme=${ifDefined(this.colorScheme ?? undefined)}>
				<div class="component-header">
	<midoc-page-header
		component-name="mm-upload"
		.declaration=${this.metadata['mm-upload']}
	></midoc-page-header>
</div>
<p><mm-upload-demo></mm-upload-demo></p>
<h3 id="metadata" tabindex="-1"><a class="header-anchor internal" href="#metadata">Metadata</a></h3>

			</div>
		`;
	}
	//#endregion

}

const module = new ContainerModule(({rebind}) => {
	rebind('midoc-page').toConstantValue(hpxzxvjxbu);
});

ContainerLoader.load(module);
