import type { Vec2 } from '@roenlie/core/types';
import type { Connection, GraphNode } from './graph.ts';
import { html, render, svg } from 'lit';
import { map } from 'lit/directives/map.js';
import { effect, signal } from './effect.ts';

export interface Viewport { x1: number, x2: number, y1: number, y2: number }


export function isOutsideViewport(viewport: Viewport, node: Vec2, padding = 0): boolean {
	const outsideX1 = node.x < (viewport.x1 - padding);
	const outsideX2 = node.x > (viewport.x2 + padding);
	const outsideY1 = node.y < (viewport.y1 - padding);
	const outsideY2 = node.y > (viewport.y2 + padding);

	return outsideX1 || outsideX2 || outsideY1 || outsideY2;
};


export class PassiveTreeSvg extends HTMLElement {

	static { queueMicrotask(() => customElements.define('passive-tree-svg', this)); }

	constructor() {
		super();
		this.#root = this.attachShadow({ mode: 'open' });

		const styles = new CSSStyleSheet();
		styles.replaceSync(`
		svg.tree {
			pointer-events: none;
		}
		path, circle, polygon {
			pointer-events: auto;
		}
		path.node-path {
			opacity: 0.5;
			stroke: darkslateblue;
			stroke-width: 2;
			fill: none;
		}
		circle.center-circle {
			stroke: rebeccapurple;
			stroke-width: 4px;
			fill: rgb(15 16 21 / 20%);
		}
		circle.path-circle {
			fill: transparent;
			stroke: silver;
			stroke-width: 1;
		}
		.path-handle {
			fill: rgb(240 240 240 / 50%);
		}
		`);

		this.#root.adoptedStyleSheets = [ styles ];
	}

	#root: ShadowRoot;

	@signal public accessor updated:      number;
	@signal public accessor viewport:     Viewport;
	@signal public accessor nodes:        Map<string, GraphNode>;
	@signal public accessor connections:  Map<string, Connection>;
	@signal public accessor selectedNode: { id: string } | undefined;
	@signal public accessor skipConnections = false;
	@signal public accessor skipConnectionHandles = false;

	protected unsubEffect?: () => void;

	public connectedCallback() {
		this.unsubEffect = effect(() => {
			for (const prop of (this as any).__signalProps)
				(this as any)[prop];

			render(this.render(), this.#root);
		});
	}

	public disconnectedCallback() {
		this.unsubEffect?.();
	}

	public render() {
		return html`
		<svg class="tree" width="4000" height="4000">
			<circle class="center-circle" r="227" cy="2000" cx="2000"></circle>

			${ Path.map(this.connections, this.nodes, this.viewport, this.skipConnections) }
			${ Node.map(this.nodes, this.viewport, this.selectedNode) }
			${ PathHandle.map(this.connections, this.viewport, this.skipConnectionHandles) }
		</svg>
		`;
	}

}


export class Path {

	public static getReduction(radius: number, a: number, b: number) {
		// Calculate the length of the direction vector
		const lengthStart = Math.sqrt(a * a + b * b);

		// Normalize the direction vector
		const nxStart = a / lengthStart;
		const nyStart = b / lengthStart;

		// Scale the normalized vector by the radius
		const reductionXStart = nxStart * radius;
		const reductionYStart = nyStart * radius;

		return [ reductionXStart, reductionYStart ] as const;
	};

	public static createPath(
		x1: number, y1: number,
		x2: number, y2: number,
		x3: number, y3: number,
	) {
		const d = ''
			+ 'M' + x1 + ' ' + y1 + ' '
			+ 'Q' + x2 + ' ' + y2 + ' '
			+ x3 + ' ' + y3;

		return d;
	}

	public static render(
		nodes: Map<string, GraphNode>,
		viewport: Viewport,
		con: Connection,
		skip = false,
		checkViewport = true,
	) {
		if (
			skip ||
			(checkViewport
			&& isOutsideViewport(viewport, con.start)
			&& isOutsideViewport(viewport, con.end))
		)
			return;

		// Assuming you have start and end coordinates
		let startX = con.start.x;
		let startY = con.start.y;
		let stopX  = con.end.x;
		let stopY  = con.end.y;
		const midX = con.middle.x;
		const midY = con.middle.y;

		// Calculate the direction vector
		const dxStart = midX - startX;
		const dyStart = midY - startY;
		const dxStop  = stopX - midX;
		const dyStop  = stopY - midY;

		const startRadius = nodes.get(con.start.id)?.radius ?? 7;
		const startReduction = this.getReduction(startRadius, dxStart, dyStart);
		startX += startReduction[0];
		startY += startReduction[1];

		const stopRadius = nodes.get(con.end.id)?.radius ?? 7;
		const endReduction = this.getReduction(stopRadius, dxStop, dyStop);
		stopX -= endReduction[0];
		stopY -= endReduction[1];

		const d = this.createPath(startX, startY, midX, midY, stopX, stopY);

		return svg`<path class="node-path" d=${ d }></path>`;
	}

	public static map(
		connections: Map<string, Connection>,
		nodes: Map<string, GraphNode>,
		viewport: Viewport,
		skip = false,
	) {
		return map(
			connections.values(),
			c => Path.render(nodes, viewport, c, skip),
		);
	}

}


export class PathHandle {

	public static calculatePathAngle(start: Vec2, end: Vec2) {
		const deltaX = end.x - start.x;
		const deltaY = end.y - start.y;
		const angleInRadians = Math.atan2(deltaY, deltaX);
		const angleInDegrees = angleInRadians * (180 / Math.PI);

		return angleInDegrees;
	};

	public static rotatePoint(point: Vec2, angleInDegrees: number, origin = { x: 0, y: 0 }) {
		const angleInRadians = angleInDegrees * (Math.PI / 180);
		const cosAngle = Math.cos(angleInRadians);
		const sinAngle = Math.sin(angleInRadians);

		const translatedX = point.x - origin.x;
		const translatedY = point.y - origin.y;

		const rotatedX = translatedX * cosAngle - translatedY * sinAngle;
		const rotatedY = translatedX * sinAngle + translatedY * cosAngle;

		return {
			x: rotatedX + origin.x,
			y: rotatedY + origin.y,
		};
	};

	public static rotateVertices(vertices: Vec2[], angleInDegrees: number, origin = { x: 0, y: 0 }) {
		return vertices.map(vertex => this.rotatePoint(vertex, angleInDegrees, origin));
	}

	public static render(viewport: Viewport, con: Connection, skip = false) {
		if (skip || isOutsideViewport(viewport, con.middle, 2))
			return;

		const length = 2;
		const rawPoints = [
			{ x: con.middle.x - length, y: con.middle.y },
			{ x: con.middle.x, y: con.middle.y - length },
			{ x: con.middle.x + length, y: con.middle.y },
			{ x: con.middle.x, y: con.middle.y + length },
		];

		const rotated = this.rotateVertices(rawPoints,
			this.calculatePathAngle(con.start, con.end), con.middle);

		const points = rotated.map(p => `${ p.x },${ p.y }`).join(' ');

		return svg`
		<polygon
			id=${ con.id }
			class="clickable path-handle"
			points=${ points }
		></polygon>
		`;
	}

	public static map(
		connections: Map<string, Connection>, viewport: Viewport, skipConnectionHandles = false,
	) {
		return map(
			connections.values(),
			c => PathHandle.render(viewport, c, skipConnectionHandles),
		);
	}

}


export class Node {

	public static render(
		viewport: Viewport, node: GraphNode, state: 'selected' | '',
	): unknown {
		if (isOutsideViewport(viewport, node, node.radius))
			return;

		let style = 'stroke:silver;stroke-width:1;';
		if (state === 'selected')
			style += 'fill:rgb(192 192 192 / 30%);';
		else
			style += 'fill:transparent;';

		return svg`
		<circle
			id   =${ node.id }
			cx   =${ node.x }
			cy   =${ node.y }
			r    =${ node.radius }
			style=${ style }
			class="clickable node-circle"
		></circle>
		`;
	};

	public static map(
		nodes: Map<string, GraphNode>,
		viewport: Viewport,
		selectedNode?: { id: string },
	) {
		return map(
			nodes.values(),
			n => this.render(viewport, n, selectedNode?.id === n.id ? 'selected' : ''),
		);
	}

}
