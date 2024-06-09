import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('demo-element')
export class DemoCmp extends LitElement {

	protected override render(): unknown {
		return html`
		<widget-grid>
			<demo-widget widget-min-col=2 widget-min-row=3></demo-widget>
			<demo-widget></demo-widget>
			<demo-widget widget-min-col=3 widget-min-row=2></demo-widget>
			<demo-widget></demo-widget>
			<demo-widget></demo-widget>
			<demo-widget></demo-widget>
		</widget-grid>
		`;
	}

	public static override styles = css`
	:host {
		display: grid;
		padding-block: 32px;
	}
	`;

}


@customElement('demo-widget')
export class WidgetCmp extends LitElement {

	protected color = [
		'dodgerblue',
		'firebrick',
		'darkslateblue',
	][Math.floor(Math.random() * 3)];

	protected override render(): unknown {
		return html`
		<style>
			:host {
				background-color: ${ this.color };
			}
		</style>

		<s-drag-handle widget-mover>
		</s-drag-handle>

		<s-drag-handle widget-resizer>
		</s-drag-handle>
		`;
	}

	public static override styles = css`
	:host {
		position: relative;
		display: block;
		border: 1px solid grey;
	}
	s-drag-handle {
		position: absolute;
		width: 50px;
		height: 50px;
		background-color: black;
		cursor: grab;

		&[widget-mover=""] {
			top: 0px;
			left: 0px;
		}
		&[widget-resizer=""] {
			bottom: 0px;
			right: 0px;
		}
	}
	`;

}
