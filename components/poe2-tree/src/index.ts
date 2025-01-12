import { css, html, LitElement, svg } from 'lit';
import { map } from 'lit/directives/map.js';
import { graph, GraphNode } from './graph.ts';
import { state } from 'lit/decorators.js';


export class Poe2Tree extends LitElement {

	@state() protected tooltip: string;
	protected graph = graph;

	protected setTooltip(ev: Event) {
		const target = ev.currentTarget as HTMLElement;
		this.tooltip = target.id;
	}

	protected removeTooltip() {
		this.tooltip = '';
	}

	protected renderNode(node: GraphNode): unknown {
		return svg`
		${ map(node.connections, connection => {
			const d = `m${ node.x } ${ node.y } L${ connection.x } ${ connection.y }`;

			return [
				svg`<path d=${ d } stroke="blue" stroke-width="4" fill="none"/>`,
				this.renderNode(connection),
			];
		}) }
		<circle
			title=${ node.id }
			id   =${ node.id }
			cx   =${ node.x }
			cy   =${ node.y }
			r    ="10"
			fill ="red"
			@mouseover=${ this.setTooltip }
			@mouseout=${ this.removeTooltip }
		/>
		`;
	}

	protected override render() {
		return html`
		<div class="title">
			${ this.tooltip }
		</div>
		<svg width="1000" height="1000" style="pointer-events:none;">
		${ map(this.graph, node => this.renderNode(node)) }
		</svg>
		`;
	}

	public static override styles = css`
	:host {
		position: relative;
		display: block;
		height: 100%;
	}
	.title{
		position: absolute;
		top: 0;
		left: 0;
		display: grid;

		min-width: 200px;
		min-height: 100px;
		border-right: 1px solid black;
		border-bottom: 1px solid black;
	}
	path, circle {
		pointer-events: auto;
	}
	path:hover {
		stroke: red;
	}
	path {
		z-index: 0;
	}
	circle {
		z-index: 1;
	}
  `;

	static { customElements.define('poe2-tree', this);	}

}

// d attribute of the path element
//The following commands are available for path data:
//M = moveto (move from one point to another point)
//L = lineto (create a line)
//H = horizontal lineto (create a horizontal line)
//V = vertical lineto (create a vertical line)
//C = curveto (create a curve)
//S = smooth curveto (create a smooth curve)
//Q = quadratic Bézier curve (create a quadratic Bézier curve)
//T = smooth quadratic Bézier curveto (create a smooth quadratic Bézier curve)
//A = elliptical Arc (create a elliptical arc)
//Z = closepath (close the path)
//Note: All of the commands above can also be expressed in lower case.
// Upper case means absolutely positioned, lower case means relatively positioned.
