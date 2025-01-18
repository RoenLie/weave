import { css, html, LitElement, svg } from 'lit';
import { map } from 'lit/directives/map.js';
import { state } from 'lit/decorators.js';
import { GraphNode } from '@roenlie/poe2-tree';
import { classMap } from 'lit/directives/class-map.js';
import { domId } from '@roenlie/core/dom';
import { roundToNearest } from '@roenlie/core/math';


export class Poe2Tree extends LitElement {

	static { queueMicrotask(() => customElements.define('poe2-tree', this)); }

	@state() protected activeTool:    string = 'add-node';
	@state() protected selectedNode?: GraphNode = undefined;
	@state() protected tooltip:       string = '';
	protected graph:                  GraphNode[] = [];
	protected renderedNodes:          Set<string> = new Set();
	protected abortCtrl:              AbortController;

	public override connectedCallback(): void {
		super.connectedCallback();

		this.abortCtrl = new AbortController();
		this.updateComplete.then(() => this.afterConnectedCallback());
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.abortCtrl.abort();
		this.disableEditMouseEvents();
	}

	public afterConnectedCallback(): void {
		const svg = this.shadowRoot?.querySelector<HTMLDivElement>('.svg-wrapper');
		const centerCircle = this.shadowRoot?.querySelector<SVGElement>('#center-circle');
		if (!svg || !centerCircle)
			return;

		const parentWidth = this.offsetWidth;
		const parentHeight = this.offsetHeight;

		// Align the center of the svg with the center of the parent
		const y = parentHeight / 2 - svg.offsetHeight / 2;
		const x = parentWidth / 2 - svg.offsetWidth / 2;
		svg.style.top = `${ y }px`;
		svg.style.left = `${ x }px`;

		centerCircle.setAttribute('cy', `${ svg.offsetHeight / 2 }`);
		centerCircle.setAttribute('cx', `${ svg.offsetWidth / 2 }`);
	}

	protected setTooltip(_ev: Event) {
		//const target = ev.currentTarget as HTMLElement;
		//this.tooltip = target.id;
	}

	protected removeTooltip() {
		//this.tooltip = '';
	}

	protected getScaleFactor(element?: HTMLElement): number {
		const svgWrapper = element ?? this.shadowRoot?.querySelector<HTMLDivElement>('.svg-wrapper');
		const scaleMatch = svgWrapper?.style.transform.match(/scale\((\d+(\.\d+)?)\)/);

		return scaleMatch ? Number(scaleMatch[1]) : 1;
	}

	protected enableEditMouseEvents() {
		const container = this.shadowRoot?.querySelector<HTMLDivElement>('.svg-wrapper');
		if (!container)
			return;

		setTimeout(() => {
			container.addEventListener('mousedown', this.onMousedownContainer,
				{ signal: this.abortCtrl.signal });
		}, 100);
	}

	protected disableEditMouseEvents() {
		const container = this.shadowRoot?.querySelector<HTMLDivElement>('.svg-wrapper');
		if (!container)
			return;

		container.removeEventListener('mousedown', this.onMousedownContainer);
	}

	protected onMousedownContainer = (ev: MouseEvent) => {
		const path = ev.composedPath();
		const circle = path.find(el =>
			el instanceof SVGElement && el.tagName === 'circle') as SVGElement | undefined;

		// You are left clicking.
		if (ev.buttons === 1) {
			ev.preventDefault();

			// You are pressing an existing circle
			if (circle) {
				const node = this.graph.find(n => n.id === circle.id);

				if (this.selectedNode) {
					// You are clicking on the same node
					// We add listeners to move the node
					if (this.selectedNode === node) {
						const scale = this.getScaleFactor();
						const offsetX = (ev.pageX - this.selectedNode.x * scale);
						const offsetY = (ev.pageY - this.selectedNode.y * scale);

						const mousemove = (mouseEv: MouseEvent) => {
							const x = roundToNearest((mouseEv.pageX - offsetX) / scale, 10);
							const y = roundToNearest((mouseEv.pageY - offsetY) / scale, 10);

							this.selectedNode!.x = x;
							this.selectedNode!.y = y;
							this.requestUpdate();
						};

						window.addEventListener('mousemove', mousemove,
							{ signal: this.abortCtrl.signal });

						window.addEventListener('mouseup', () => {
							window.removeEventListener('mousemove', mousemove);
						}, { once: true, signal: this.abortCtrl.signal });
					}
					// You are clicking on a different node
					// We need to connect the two nodes
					else if (node) {
						if (!node.connections.includes(this.selectedNode))
							node.connections.push(this.selectedNode);
						if (!this.selectedNode.connections.includes(node))
							this.selectedNode.connections.push(node);
					}
				}

				this.selectedNode = node;

				return;
			}

			// You are adding a new circle
			const x = roundToNearest(ev.offsetX, 10);
			const y = roundToNearest(ev.offsetY, 10);

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

		// You are right clicking.
		if (ev.buttons === 2) {
			ev.preventDefault();

			window.addEventListener('contextmenu',
				(e) => e.preventDefault(), { once: true });

			// You are right clicking on an existing circle
			// We remove the circle and all connections to it
			if (circle) {
				const index = this.graph.findIndex(n => n.id === circle.id);
				if (index > -1) {
					const node = this.graph.splice(index, 1)[0]!;
					this.graph.forEach(n => {
						const i = n.connections.findIndex(c => c.id === node.id);
						if (i > -1)
							n.connections.splice(i, 1);
					});
				}
			}

			this.selectedNode = undefined;
			this.requestUpdate();

			return;
		}

		// You are pressing the middle mouse button
		if (ev.buttons === 4) {
			ev.preventDefault();

			const svgWrapper = this.shadowRoot?.querySelector<HTMLDivElement>('.svg-wrapper');
			if (!svgWrapper)
				return;

			const offsetY = ev.pageY - svgWrapper.offsetTop;
			const offsetX = ev.pageX - svgWrapper.offsetLeft;
			const mousemove = (mouseEv: MouseEvent) => {
				svgWrapper.style.top = (mouseEv.pageY - offsetY) + 'px';
				svgWrapper.style.left = (mouseEv.pageX - offsetX) + 'px';
			};

			window.addEventListener('mousemove', mousemove,
				{ signal: this.abortCtrl.signal });

			window.addEventListener('mouseup', () => {
				window.removeEventListener('mousemove', mousemove);
			}, { once: true, signal: this.abortCtrl.signal });

			return;
		}
	};

	protected onWheelContainer = (ev: WheelEvent) => {
		ev.preventDefault();
		const svgWrapper = this.shadowRoot?.querySelector<HTMLDivElement>('.svg-wrapper');
		if (!svgWrapper)
			return;

		const scale = this.getScaleFactor(svgWrapper);
		const newScale = Math.max(0.1, Number(scale) + ev.deltaY / -1000);
		svgWrapper.style.transform = `scale(${ newScale })`;
	};

	protected renderNode(node: GraphNode): unknown {
		if (this.renderedNodes.has(node.id))
			return;

		this.renderedNodes.add(node.id);

		return svg`
		${ map(node.connections, connection => {
			const a = `${ node.id }-${ connection.id }`;
			const b = `${ connection.id }-${ node.id }`;
			if (this.renderedNodes.has(a) || this.renderedNodes.has(b))
				return;

			this.renderedNodes.add(a);
			this.renderedNodes.add(b);

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

		return html`
		<div class="container"
			tabindex="0"
			@focus=${ this.enableEditMouseEvents }
			@blur=${ this.disableEditMouseEvents }
			@wheel=${ this.onWheelContainer }
		>
			<div class="title">
				${ this.tooltip }
			</div>
			<div class=${ classMap({ controls: true, tool: this.activeTool }) }>
				<button class=${ this.activeTool === 'add-node' ? 'active' : '' }>
					Add Node
				</button>
				<button class=${ this.activeTool === 'select-node' ? 'active' : '' }>
					Select Node
				</button>
			</div>

		<div class="svg-wrapper" style="position: absolute;">
			<svg
				width="6000"
				height="6000"
				style="pointer-events:none;border:1px solid black;"
			>
				<circle
					id="center-circle"
					r="100"
					stroke="rebeccapurple"
					stroke-width="4"
				></circle>
				${ map(this.graph, node => this.renderNode(node)) }
			</svg>
		</div>
	</div>
	`;
	}

	public static override styles = css`
		:host, .container {
			display: block;
			height: 100%;
			overflow: hidden;
		}
		.container {
			position: relative;
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
