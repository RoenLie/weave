import { css, html, LitElement, svg, type PropertyValues } from 'lit';
import { map } from 'lit/directives/map.js';
import { state } from 'lit/decorators.js';
import { GraphNode } from '@roenlie/poe2-tree';
import { classMap } from 'lit/directives/class-map.js';
import { domId } from '@roenlie/core/dom';


export class Poe2Tree extends LitElement {

	@state() protected activeTool:    string = 'add-node';
	@state() protected selectedNode?: GraphNode = undefined;
	@state() protected tooltip:       string = '';
	protected graph:                  GraphNode[] = [];
	protected renderedNodes:          Set<string> = new Set();
	protected renderedConnections:    Set<string> = new Set();

	protected override updated(_changedProperties: PropertyValues): void {
		super.updated(_changedProperties);
	}

	protected setTooltip(ev: Event) {
		//const target = ev.currentTarget as HTMLElement;
		//this.tooltip = target.id;
	}

	protected removeTooltip() {
		//this.tooltip = '';
	}

	protected onAddNode(ev: Event) {
		ev.stopPropagation();
		this.activeTool = 'add-node';
	}

	protected onSelectNode(ev: Event) {
		ev.stopPropagation();
		this.activeTool = 'select-node';
	}

	protected onMousedownContainer(ev: PointerEvent) {
		const path = ev.composedPath();
		const circle = path.find(el =>
			el instanceof SVGElement && el.tagName === 'circle') as SVGElement | undefined;

		if (ev.buttons === 2) {
			window.addEventListener('contextmenu',
				(e) => e.preventDefault(), { once: true });

			this.selectedNode = undefined;
			this.requestUpdate();

			return;
		}

		if (this.activeTool === 'add-node') {
			if (circle) {
				const node = this.graph.find(n => n.id === circle.id);

				if (this.selectedNode) {
					if (node) {
						if (!node.connections.includes(this.selectedNode))
							node.connections.push(this.selectedNode);
						if (!this.selectedNode.connections.includes(node))
							this.selectedNode.connections.push(node);
					}
				}

				this.selectedNode = node;

				return;
			}

			const x = ev.pageX;
			const y = ev.pageY;

			const node = new GraphNode(x, y, domId());
			if (this.selectedNode) {
				if (!node.connections.includes(this.selectedNode))
					node.connections.push(this.selectedNode);
				if (!this.selectedNode.connections.includes(node))
					this.selectedNode.connections.push(node);

				this.selectedNode = node;
			}
			else {
				this.selectedNode = node;
			}

			this.graph.push(node);
			this.requestUpdate();

			return;
		}
	}

	protected renderNode(node: GraphNode): unknown {
		if (this.renderedNodes.has(node.id))
			return;

		this.renderedNodes.add(node.id);

		const connections = node.connections.filter(v => {
			const a = `${ node.id }-${ v.id }`;
			const b = `${ v.id }-${ node.id }`;

			return !(this.renderedConnections.has(a) || this.renderedConnections.has(b));
		});

		return svg`
		${ map(connections, connection => {
			const a = `${ node.id }-${ connection.id }`;
			const b = `${ connection.id }-${ node.id }`;
			this.renderedConnections.add(a);
			this.renderedConnections.add(b);

			const d = `m${ node.x } ${ node.y } L${ connection.x } ${ connection.y }`;

			return svg`<path d=${ d } stroke="blue" stroke-width="4" fill="none"></path>`;
		}) }

		<circle
			title=${ node.id }
			id   =${ node.id }
			cx   =${ node.x }
			cy   =${ node.y }
			r    ="10"
			fill ="red"
			class=${ classMap({ active: this.selectedNode?.id === node.id }) }
			@mouseover=${ this.setTooltip }
			@mouseout=${ this.removeTooltip }
		></circle>
		`;
	}

	protected override render() {
		this.renderedNodes.clear();
		this.renderedConnections.clear();

		return html`
		<div class="container"
			@mousedown=${ this.onMousedownContainer }
		>
			<div class="title">
				${ this.tooltip }
			</div>
			<div class=${ classMap({ controls: true, tool: this.activeTool }) }>
				<button
					class=${ classMap({ active: this.activeTool === 'add-node' }) }
					@click=${ this.onAddNode }
				>
					Add Node
				</button>

				<button
					class=${ classMap({ active: this.activeTool === 'select-node' }) }
					@click=${ this.onSelectNode }
				>
				Select Node
			</button>
		</div>

		<svg width="2000" height="2000" style="pointer-events:none;border:1px solid white;">
			<circle
				cx="1000"
				cy="1000"
				r="100"
				stroke="rebeccapurple"
				stroke-width="4"
			></circle>
			${ map(this.graph, node => this.renderNode(node)) }
		</svg>
	</div>
	`;
	}

	public static override styles = css`
		:host {
			display: block;
			height: 100%;
		}
		.container {
			display: block;
			height: 100%;
		}
		.title {
			position: fixed;
			top: 0;
			left: 0;
			display: grid;

			min-width: 200px;
			min-height: 100px;
			border-right: 1px solid black;
			border-bottom: 1px solid black;
		}
		.controls {
			position: fixed;
			top: 0;
			right: 0;
			display: grid;

			min-width: 200px;
			min-height: 100px;
			border-left: 1px solid black;
			border-bottom: 1px solid black;

			button.active {
				background: blue;
			}
		}
		path, circle {
			pointer-events: auto;
		}
		path {
			z-index: 0;
		}
		circle {
			z-index: 1;

			&.active {
				fill: green;
			}
		}
  `;

}

customElements.define('poe2-tree', Poe2Tree);

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
