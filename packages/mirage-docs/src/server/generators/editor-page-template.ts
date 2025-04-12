import { fileExt } from '../build/helpers/is-dev-mode.js';
import { randomString } from '../build/helpers/string.js';


export const editorPageTemplate = (props: {
	tag:    string;
	code:   string;
	class:  string;
	codeId: string;
}): string => {
	const className = randomString(10);

	return `
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis/index.${ fileExt() }';
import { PageAdapter } from '@roenlie/mirage-docs/app/components/page/page-element.${ fileExt() }';
import { ComponentEditor } from '@roenlie/mirage-docs/app/components/page/component-editor.${ fileExt() }';
import { css, html } from 'lit';
import '${ props.codeId }';


class ${ className } extends PageAdapter {

	static refs = [ ComponentEditor ];

	protected content: string = \`${ props.code }\`;

	public override render() {
		return html\`
			<midoc-component-editor
				immediate
				.source=\${this.content}
			></midoc-component-editor>
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
	rebind('midoc-page').toConstantValue(${ className });
});

ContainerLoader.load(module);
`;
};
