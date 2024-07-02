import { fileExt } from '../build/helpers/is-dev-mode.js';
import { randomString } from '../build/helpers/string.js';


export const editorPageTemplate = (props: {
	tag:      string;
	code:     string;
	class:    string;
	codeId:   string;
}) => {
	const className = randomString(10);

	return `
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.${ fileExt() }';
import { PageAdapter } from '@roenlie/mirage-docs/app/components/page/page-element.${ fileExt() }';
import '@roenlie/mirage-docs/app/components/page/component-editor.${ fileExt() }';
import { css, html } from 'lit';
import '${ props.codeId }';

class ${ className } extends PageAdapter {
	protected content: string = \`${ props.code }\`;

	public override render() {
		return html\`
			<docs-component-editor
				immediate
				.source=\${this.content}
			></docs-component-editor>
		\`;
	}

	public static override styles = [
		css\`
		:host {
			display: grid;
			overflow: hidden;
		}
		\`,
	]
}

const module = new ContainerModule(({rebind}) => {
	rebind('midoc-page').to(${ className });
});

ContainerLoader.load(module);
`;
};
