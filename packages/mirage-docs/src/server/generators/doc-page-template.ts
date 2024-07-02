import { fileExt } from '../build/helpers/is-dev-mode.js';
import { randomString } from '../build/helpers/string.js';


export const docPageTemplate = (props: {
	hoisted:       string;
	imports:       string;
	examples:      string;
	metadata:      string;
	markdown:      string;
}) => {
	const className = randomString(10);

	return `
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.${ fileExt() }';
import { PageAdapter } from '@roenlie/mirage-docs/app/components/page/page-element.${ fileExt() }';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js'
// injected imports
${ props.imports }
// hoisted
${ props.hoisted }

class ${ className } extends PageAdapter {

	//#region properties
	protected examples: Record<string, string> = ${ props.examples };
	protected metadata: Record<string, any> = ${ props.metadata };
	//#endregion

	//#region template
	public override render() {
		return html\`
			<div id="page-start" style="display:none;"></div>
			<div class="markdown-body" color-scheme=\${ifDefined(this.colorScheme ?? undefined)}>
				${ props.markdown }
			</div>
		\`;
	}
	//#endregion

}

const module = new ContainerModule(({rebind}) => {
	rebind('midoc-page').to(${ className });
});

ContainerLoader.load(module);
`;
};
