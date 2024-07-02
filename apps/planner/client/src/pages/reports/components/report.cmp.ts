import { ContainerModule, InjectableElement, injectableElement, injectProp } from '@roenlie/lit-utilities/injectable';
import { css, html } from 'lit';

import { componentStyles } from '../../../features/shared-styles/component-styles.js';


const module = new ContainerModule(({ bind }) => {
	bind('report-secret').toDynamicValue(() => 'super secret').inSingletonScope();
});


@injectableElement('pl-report', {
	modules: [ async  () => module ],
})
export class ReportCmp extends InjectableElement {

	@injectProp('report-secret') protected reportSecret: string;

	public override connectedCallback() {
		super.connectedCallback();
	}

	protected override injectionCallback() {
		console.log(this.reportSecret);
	}

	public override render() {
		return html`
			<div>new-component</div>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			display: grid;
		}
	`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-report': ReportCmp;
	}
}
