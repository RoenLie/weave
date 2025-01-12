import { css, html, LitElement, svg } from 'lit';
import { map } from 'lit/directives/map.js';


interface GraphNode {
	x:           number;
	y:           number;
	connections: GraphNode[];
}


export class Poe2Tree extends LitElement {


	protected graph = [
		{
			x:           50,
			y:           200,
			connections: [
				{
					x:           150,
					y:           200,
					connections: [],
				},
				{
					x:           50,
					y:           100,
					connections: [],
				},
			],
		},
	];

	protected renderNode(node: GraphNode): unknown {
		return svg`
		<circle cx="${ node.x }" cy="${ node.y }" r="10" fill="red"/>
		${ map(node.connections, connection => {
			const d = `m${ node.x } ${ node.y } L${ connection.x } ${ connection.y }`;

			return [
				svg`<path id="lineAC" d=${ d } stroke="blue" stroke-width="4" fill="none"/>`,
				this.renderNode(connection),
			];
		}) }
		`;
	}

	protected override render() {
		return html`
		<svg width="1000" height="1000" style="pointer-events:none;">
		${ map(this.graph, node => this.renderNode(node)) }
		</svg>
		`;
	}

	public static override styles = css`
	:host {
		display: block;
		height: 100%;
	}
	path, circle {
		pointer-events: auto;
	}
	path:hover {
		stroke: red;
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
