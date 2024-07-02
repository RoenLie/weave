import { $Container, ContainerModule, InjectableElement, injectableElement, injectProp } from '@roenlie/lit-utilities/injectable';
import { Container } from 'inversify';
import { css, html } from 'lit';

import { componentStyles } from '../../features/shared-styles/component-styles.js';

const module = new ContainerModule(({ bind }) => {
	bind('report-page-secret').toDynamicValue(() => 'super secret').inSingletonScope();
});


@injectableElement('pl-reports-page', {
	modules: [ async () => module ],
})
export class ReportsPageCmp extends InjectableElement {

	@injectProp('report-secret') protected reportSecret: string;
	@injectProp($Container) protected container2: Container;

	public override connectedCallback() {
		super.connectedCallback();
	}

	protected override injectionCallback() {
		console.log(this.reportSecret);
		console.log(this.container2);
	}

	public override render() {
		return html`
			<div>new-component</div>

			<div>
				<pl-report></pl-report>
			</div>
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
		'pl-reports-page': ReportsPageCmp;
	}
}
