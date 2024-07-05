import { MMProgressBar } from '@roenlie/elements/progress-bar';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

MMProgressBar.register();


@customElement('mm-progressbar-demo')
export class ProgressBarDemo extends LitElement {

	public override render() {
		return html`
		<mm-progress-bar indeterminate></mm-progress-bar>
		`;
	}

	public static override styles = [
		css`
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-progress-bar-demo': ProgressBarDemo;
	}
}
