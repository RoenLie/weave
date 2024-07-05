import { MMTabGroup } from '@roenlie/elements/tabs';
import { css, html, LitElement, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';

MMTabGroup.register();


@customElement('mm-tabs-demo')
export class TabsDemoCmp extends LitElement {

	protected Panel = {
		general: () => html`
		<mm-tab-panel name="general">This is the general tab panel.</mm-tab-panel>
		`,
		custom: () => html`
		<mm-tab-panel name="custom">This is the custom tab panel.</mm-tab-panel>
		`,
		advanced: () => html`
		<mm-tab-panel name="advanced">This is the advanced tab panel.</mm-tab-panel>
		`,
		disabled: () => html`
		<mm-tab-panel name="disabled">This is a disabled tab panel.</mm-tab-panel>
		`,
		component: () => html`
		<mm-tab-panel name="component"><mm-dummy></mm-dummy></mm-tab-panel>
		`,
		empty: () => nothing,
	};

	protected activeTab = () => (this.renderRoot
		.querySelector('mm-tab-group')?.activeTabName ?? 'empty') as keyof typeof this.Panel;

	public override render() {
		return html`
		<mm-tab-group @mm-tab-show=${ () => {
			console.log('show?');
			this.requestUpdate();
		} }>
			<mm-tab slot="nav" panel="general">General</mm-tab>
			<mm-tab slot="nav" panel="custom">Custom</mm-tab>
			<mm-tab slot="nav" panel="advanced">Advanced</mm-tab>
			<mm-tab slot="nav" panel="disabled" disabled>Disabled</mm-tab>
			<mm-tab slot="nav" panel="component" active closable>Component</mm-tab>

			${ this.Panel[this.activeTab()]() }
		</mm-tab-group>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: flex;
		}
	`,
	];

}


@customElement('mm-dummy')
class DummyTest extends LitElement {

	public override connectedCallback(): void {
		super.connectedCallback();

		console.log('dummy component connected.');
	}

	protected override render() {
		return html`
		Render function from component.
		`;
	}

}
