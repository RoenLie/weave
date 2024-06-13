import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../../src/index.ts';


@customElement('demo-element')
export class DemoCmp extends LitElement {

	protected override render(): unknown {
		return html`
		<widget-grid
			@change=${ (ev: CustomEvent) => console.log('config updated', ev) }
		>
			<demo-widget></demo-widget>
			<demo-widget></demo-widget>
			<demo-widget></demo-widget>
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
			Move
		</s-drag-handle>

		<s-drag-handle widget-resizer>
			Resize
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
		display: block;
		width: 60px;
		height: 40px;
		text-align: center;
		align-content: center;
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
