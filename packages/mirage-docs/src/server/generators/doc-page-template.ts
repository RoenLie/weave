import { fileExt } from '../build/helpers/is-dev-mode.js';
import { randomString } from '../build/helpers/string.js';


export const docPageTemplate = (props: {
	hoisted:  string;
	imports:  string;
	examples: string;
	metadata: string;
	markdown: string;
}): string => {
	const className = randomString(10);

	return `
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js'
import { mermaid } from '@roenlie/mirage-docs/app/utilities/mermaid.js';
import { PageAdapter } from '@roenlie/mirage-docs/app/components/page/page-element.${ fileExt() }';
import { container } from '@roenlie/mirage-docs/container/container.${ fileExt() }'

// injected imports
${ props.imports }
// hoisted
${ props.hoisted }

class ${ className } extends PageAdapter {

	//#region properties
	protected examples: Record<string, string> = ${ props.examples };
	protected metadata: Record<string, any> = ${ props.metadata };
	//#endregion

	public override afterConnectedCallback() {
		mermaid.initialize({
			startOnLoad: true,
			theme: this.colorScheme === 'dark' ? 'dark' : 'default'
		});
	}

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

container.rebind('midoc-page').constant(${ className });
`;
};
