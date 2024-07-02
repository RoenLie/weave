
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.js';
import { PageAdapter } from '@roenlie/mirage-docs/app/components/page/page-element.js';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js'
// injected imports
import '/../docs/pages/tabs/tab.demo.ts';
import '@roenlie/mirage-docs/app/components/page/page-header.js';
// hoisted


class tyzgucndwv extends PageAdapter {

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
		component-name="mm-tab-group"
		.declaration=${this.metadata['mm-tab-group']}
	></midoc-page-header>
</div>
<p><mm-tabs-demo></mm-tabs-demo></p>
<br>
<h3 id="metadata-tab-group" tabindex="-1"><a class="header-anchor internal" href="#metadata-tab-group">Metadata tab group</a></h3>
<br>
<h3 id="metadata-tab" tabindex="-1"><a class="header-anchor internal" href="#metadata-tab">Metadata tab</a></h3>
<br>
<h3 id="metadata-tab-panel" tabindex="-1"><a class="header-anchor internal" href="#metadata-tab-panel">Metadata tab panel</a></h3>

			</div>
		`;
	}
	//#endregion

}

const module = new ContainerModule(({rebind}) => {
	rebind('midoc-page').to(tyzgucndwv);
});

ContainerLoader.load(module);
