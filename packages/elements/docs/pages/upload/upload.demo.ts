import { MMUpload } from '@roenlie/elements/upload';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';

MMUpload.register();


@customElement('mm-upload-demo')
export class UploadDemo extends LitElement {

	protected override render() {
		return html`
		<mm-upload></mm-upload>
		`;
	}

	public static override styles = [
		css`
		`,
	];

}
