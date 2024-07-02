import { editorComponent } from '@roenlie/mirage-docs/app/components/page/editor-component.js';


export default editorComponent(({ html, css }) => {
	return {
		render() {
			return html`
			<div>Hello there</div>
			`;
		},
	};
});
