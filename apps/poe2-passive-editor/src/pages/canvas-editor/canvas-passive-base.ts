import { html } from 'lit-html';
import { css, signal, type CSSStyle } from '../../app/custom-element/signal-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { Connection, GraphNode, type StorableConnection, type StorableGraphNode, type StringVec2 } from '../../app/graph/graph.ts';
import { isOutsideViewport } from '../../app/canvas/is-outside-viewport.ts';
import { Canvas2DObject } from './canvas-object.ts';
import { getPathReduction, isRectInsideAnother } from '../../app/canvas/path-helpers.ts';
import { maybe } from '@roenlie/core/async';
import { range } from '@roenlie/core/array';
import { getBackgroundChunk } from './image-assets.ts';
import { CustomElement } from '../../app/custom-element/custom-element.ts';
import { ImmediateOrDebounced, View } from '../../app/canvas/canvas-view.ts';
import { when } from 'lit-html/directives/when.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { drawParallelBezierCurve, type Bezier } from '../../app/canvas/parallel-bezier-curve.ts';


const unsetPopover = css`
background: unset;
overflow: unset;
padding:  unset;
margin:   unset;
border:   unset;
height:   unset;
width:    unset;
inset:    unset;
color:    unset;
`;


export class PoeCanvasPassiveBase extends CustomElement {

	@signal protected accessor selectedNode: GraphNode | undefined;
	@signal protected accessor hoveredNode:  GraphNode | undefined;

	protected nodes:         Map<string, GraphNode> = new Map();
	protected connections:   Map<string, Connection> = new Map();
	protected imageSize:     number = 13000;
	protected chunkSize:     number = 1300;
	protected imagePromises: Map<StringVec2, Promise<any>> = new Map();
	protected images:        {
		x:        number,
		y:        number;
		image:    HTMLImageElement | undefined;
		getImage: () => Promise<HTMLImageElement>;
	}[] = [];

	protected readonly bgView:   View = new View();
	protected readonly mainView: View = new View();
	protected readonly resizeObserver = new ResizeObserver(entries => {
		const entry = entries[0];
		if (!entry)
			return;

		const width = entry.contentRect.width;
		const height = entry.contentRect.height;

		this.bgView.setCanvasSize(width, height);
		this.mainView.setCanvasSize(width, height);

		this.drawBackgroundCanvas.immediate();
		this.drawMainCanvas.debounced();
	});

	protected override connectedCallback(): void {
		super.connectedCallback();
		this.tabIndex = 0;
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.resizeObserver.unobserve(this);
	}

	protected override async afterConnected(): Promise<void> {
		super.afterConnected();

		//const { nodes, connections } = await this.loadFromOPFS();
		const { nodes, connections } = await this.loadFromLocalAsset();

		this.nodes = new Map(nodes.map(node => {
			const parsed = new GraphNode(node);

			return [ parsed.id, parsed ];
		}));

		this.connections = new Map(connections.map(con => {
			const parsed = new Connection(this.nodes, con);

			return [ parsed.id, parsed ];
		}));

		for (const node of this.nodes.values())
			node.mapConnections(this.connections);

		const width = this.offsetWidth;
		const height = this.offsetHeight;

		const bgCanvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#background')!;
		this.bgView.setContext(bgCanvas);
		this.bgView.setCanvasSize(width, height);
		this.bgView.setTotalArea(this.imageSize, this.imageSize);

		const mainCanvas = this.shadowRoot!.querySelector<HTMLCanvasElement>('#main')!;
		this.mainView.setContext(mainCanvas);
		this.mainView.setCanvasSize(width, height);
		this.mainView.setTotalArea(this.imageSize, this.imageSize);

		this.initializeBackground();
		this.resizeObserver.observe(this);
	}

	protected override afterUpdate(changedProps: Set<string>): void {
		super.afterUpdate(changedProps);

		if (changedProps.has('hoveredNode')) {
			if (this.hoveredNode) {
				const tooltip = this.shadowRoot?.querySelector<HTMLElement>('article[popover="manual"]');
				if (tooltip)
					tooltip.showPopover();
			}
		}
	}

	protected async loadFromOPFS() {
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('tree-canvas', { create: true });
		const file       = await fileHandle.getFile();

		return JSON.parse(await file.text()) as {
			nodes:       StorableGraphNode[];
			connections: StorableConnection[];
		};
	}

	protected async loadFromLocalAsset() {
		const [ data, err ] = await maybe(import('../../assets/graphs/graph-version-2.json?inline')
			.then(res => res.default));

		if (err)
			throw err;

		return data as any as {
			nodes:       StorableGraphNode[];
			connections: StorableConnection[];
		};
	}

	protected initializeBackground() {
		this.images = range(0, 100).map(i => {
			return {
				x:        (i % 10) * this.chunkSize,
				y:        Math.floor(i / 10) * this.chunkSize,
				image:    undefined,
				getImage: () => getBackgroundChunk(i),
			};
		});

		const imageSize = this.imageSize;
		const parentWidth = this.offsetWidth;
		const parentHeight = this.offsetHeight;
		const y = parentHeight / 2 - imageSize / 2;
		const x = parentWidth  / 2 - imageSize  / 2;

		this.bgView.moveTo(x, y);
		this.mainView.moveTo(x, y);

		this.drawBackgroundCanvas.debounced();
		this.drawMainCanvas.debounced();
	}

	protected isImgInView(img: { x: number, y: number }) {
		const { x: dx1, y: dy1 } = img;
		const dx2 = dx1 + this.chunkSize;
		const dy2 = dy1 + this.chunkSize;

		const { x1, x2, y1, y2 } = this.bgView.viewport;

		return isRectInsideAnother([ dx1, dy1, dx2, dy2 ], [ x1, y1, x2, y2 ]);
	}

	protected getGraphNode(vec: Vec2): GraphNode | undefined {
		// If found, returns the node at the mouse position.
		for (const [ , node ] of this.nodes) {
			if (!node.path)
				continue;

			const isInPath = node.path.isPointInPath(this.mainView.context, vec.x, vec.y);
			if (isInPath)
				return node;
		}
	}

	protected onMousemove(ev: MouseEvent) {
		const vec = { x: ev.offsetX, y: ev.offsetY };
		const node = this.getGraphNode(vec);

		// Holding alt or the meta key will prevent hover behavior.
		if ((!ev.altKey && !ev.metaKey)) {
			// Remove the hover effect if no node, or a new node is hovered
			if (this.hoveredNode && node !== this.hoveredNode) {
				const node = this.hoveredNode;

				this.beforeCloseTooltip(node);
				this.hoveredNode = undefined;

				node.path = this.createNodePath2D(node);
				this.drawMainCanvas.debounced();
			}

			// Add the hover effect if a node is hovered
			if (node && node !== this.hoveredNode) {
				this.hoveredNode = node;
				this.hoveredNode.path = this.createNodePath2D(node);
				this.drawMainCanvas.debounced();
			}
		}
	}

	protected onMousewheel(ev: WheelEvent) {
		ev.preventDefault();

		const x = ev.offsetX;
		const y = ev.offsetY;

		if (-ev.deltaY > 0) {
			this.bgView.scaleAt({ x, y }, 1.1);
			this.mainView.scaleAt({ x, y }, 1.1);
		}
		else {
			this.bgView.scaleAt({ x, y }, 1 / 1.1);
			this.mainView.scaleAt({ x, y }, 1 / 1.1);
		}

		this.drawBackgroundCanvas.debounced();
		this.drawMainCanvas.debounced();
	}

	protected onMousedown(downEv: MouseEvent) {
		// We only care about left clicks
		if (downEv.buttons !== 1)
			return;

		downEv.preventDefault();
		this.focus();

		const rect = this.getBoundingClientRect();
		const deltaY = rect.top;
		const deltaX = rect.left;

		// Get the offset from the corner of the current view to the mouse position
		const viewOffsetX = downEv.offsetX - this.mainView.position.x;
		const viewOffsetY = downEv.offsetY - this.mainView.position.y;

		const vec = { x: downEv.offsetX, y: downEv.offsetY };
		// Try to find a node at the mouse position
		const node = this.getGraphNode(vec);

		// If we found a node, we want to move it
		if (node) {
			// We are clicking on a node
			if (this.selectedNode?.path) {
				const node = this.selectedNode;
				this.selectedNode = undefined;
				node.path = this.createNodePath2D(node);
			}

			this.selectedNode = node;
			node.path = this.createNodePath2D(node);

			this.drawMainCanvas.debounced();
		}
		// If we didn't find a node or a connection, we want to pan the view
		// and create a node if alt/cmd is pressed
		else {
			// We setup the mousemove and mouseup events
			// For panning the view
			const mousemove = (moveEv: MouseEvent) => {
				const x = moveEv.offsetX - deltaX - viewOffsetX;
				const y = moveEv.offsetY - deltaY - viewOffsetY;

				this.bgView.moveTo(x, y);
				this.mainView.moveTo(x, y);

				this.drawBackgroundCanvas.debounced();
				this.drawMainCanvas.debounced();
			};
			const mouseup = () => {
				removeEventListener('mousemove', mousemove);
				removeEventListener('mouseup', mouseup);
			};

			addEventListener('mousemove', mousemove);
			addEventListener('mouseup', mouseup);
		}
	}

	protected createConnectionPath2D(nodes: Map<string, GraphNode>, con: Connection) {
		const startVec = structuredClone(con.start);
		const stopVec = structuredClone(con.stop);
		const mid1Vec = structuredClone(con.m1);
		const mid2Vec = structuredClone(con.m2);

		const startRadius = nodes.get(con.start.id)!.radius;
		const [ startXReduce, startYReduce ] = getPathReduction(startRadius, startVec, mid1Vec);
		startVec.x += startXReduce;
		startVec.y += startYReduce;

		const stopRadius = nodes.get(con.stop.id)!.radius;
		const [ stopXReduce, stopYReduce ] = getPathReduction(stopRadius, mid2Vec, stopVec);
		stopVec.x -= stopXReduce;
		stopVec.y -= stopYReduce;

		const path = new Canvas2DObject();
		path.layer(
			// Middle bezier curve
			(path2D) => {
				path2D.moveTo(startVec.x, startVec.y);
				path2D.bezierCurveTo(
					mid1Vec.x, mid1Vec.y,
					mid2Vec.x, mid2Vec.y,
					stopVec.x, stopVec.y,
				);
			},
			(ctx, path2D) => {
				//ctx.strokeStyle = 'rgb(33, 29, 16)';
				ctx.strokeStyle = 'darkslateblue';
				ctx.lineWidth = 3;
				ctx.stroke(path2D);

				ctx.strokeStyle = '';
				ctx.lineWidth = 0;
			},
		).layer(
			// Parallel bezier curves
			(path2D) => {
				const bezier = [
					[ startVec.x, startVec.y ],
					[ mid1Vec.x, mid1Vec.y ],
					[ mid2Vec.x, mid2Vec.y ],
					[ stopVec.x, stopVec.y ],
				] as Bezier;

				drawParallelBezierCurve(path2D, bezier, 2);
				drawParallelBezierCurve(path2D, bezier, -2);
			},
			(ctx, path2D) => {
				//ctx.strokeStyle = 'rgb(67, 63, 54)';
				ctx.strokeStyle = 'goldenrod';
				ctx.lineWidth = 2;
				ctx.stroke(path2D);

				ctx.strokeStyle = '';
				ctx.lineWidth = 0;
			},
		);

		return path;
	}

	protected mapConnectionPath2Ds() {
		for (const con of this.connections.values()) {
			const outsideStart = isOutsideViewport(this.mainView.viewport, con.start);
			const outsideMid1  = isOutsideViewport(this.mainView.viewport, con.m1);
			const outsideMid2  = isOutsideViewport(this.mainView.viewport, con.m2);
			const outsideStop  = isOutsideViewport(this.mainView.viewport, con.stop);
			if (outsideStart && outsideStop && outsideMid1 && outsideMid2)
				continue;

			con.path ??= this.createConnectionPath2D(this.nodes, con);
			con.path.draw(this.mainView.context);
		}
	}

	protected createNodePath2D(node: GraphNode) {
		const path = new Canvas2DObject();
		path.layer(
			(path2D) => {
				path2D.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
			},
			(ctx, path2D) => {
				if (!node.data) {
					ctx.strokeStyle = 'white';
					ctx.lineWidth = 2;
					ctx.stroke(path2D);
				}

				if (this.selectedNode === node) {
					ctx.fillStyle = 'rgb(255 255 255 / 20%)';
					ctx.fill(path2D);
				}
				else if (this.hoveredNode === node) {
					ctx.fillStyle = 'rgb(241 194 50 / 50%)';
					ctx.fill(path2D);
				}

				ctx.lineWidth = 0;
				ctx.strokeStyle = '';
				ctx.fillStyle = '';
			},
		);

		return path;
	}

	protected mapNodePath2Ds() {
		for (const node of this.nodes.values()) {
			if (isOutsideViewport(this.mainView.viewport, node))
				continue;

			node.path ??= this.createNodePath2D(node);
			node.path.draw(this.mainView.context);
		}
	}

	protected drawBackground() {
		const { bgView } = this;
		bgView.clearContext();

		for (const image of this.images) {
			if (!this.isImgInView(image))
				continue;

			const imgId = `x${ image.x }y${ image.y }` as StringVec2;
			const x = image.x;
			const y = image.y;

			if (image.image) {
				bgView.context.drawImage(image.image, x, y);
			}
			else if (!this.imagePromises.has(imgId)) {
				this.imagePromises.set(
					imgId,
					image.getImage().then(img => {
						image.image = img;
						this.imagePromises.delete(imgId);
						this.drawBackgroundCanvas.debounced();
					}),
				);
			}
		}

		//const status = this.images.reduce((acc, img, i) => {
		//	const row = Math.floor(i / 10);
		//	const col = i % 10;

		//	acc[row] ??= [];
		//	acc[row][col] = this.isImgInView(img) ? '❤️' : '☠️';

		//	return acc;
		//}, []);

		//console.clear();
		//console.table(status);
	}

	protected drawMain() {
		this.mainView.clearContext();

		const percentage = this.mainView.visiblePercentage;
		if (percentage < 50)
			this.mapConnectionPath2Ds();

		if (percentage < 50)
			this.mapNodePath2Ds();

		this.requestUpdate();
	}

	protected drawBackgroundCanvas = new ImmediateOrDebounced(this.drawBackground.bind(this));
	protected drawMainCanvas = new ImmediateOrDebounced(this.drawMain.bind(this));


	protected beforeCloseTooltip(_node: GraphNode) {}
	protected beforeOpenTooltip(_node: GraphNode) {}

	protected renderTooltip(node: GraphNode): unknown {
		if (!node.data)
			return 'MISSING DATA';

		return html`
		<div style="white-space:nowrap;">
			${ node.data.id }
		</div>
		<div>
			${ node.data.description }
		</div>
		`;
	}

	protected override render(): unknown {
		return html`
		<canvas id="background"></canvas>
		<canvas id="main"
			@mousemove=${ this.onMousemove }
			@mousedown =${ this.onMousedown }
			@mousewheel=${ this.onMousewheel }
		></canvas>

		${ when(this.hoveredNode && (this.mainView.visiblePercentage < 5), () => {
			const node = this.hoveredNode!;
			const rect = this.getBoundingClientRect();
			const scale = this.mainView.scale;
			const x = (node.x * scale) + (this.mainView.position.x + rect.left) + (node.radius * scale);
			const y = (node.y * scale) + (this.mainView.position.y + rect.top)  - (node.radius * scale);

			return html`
			<article
				style=${ styleMap({ top: y + 'px', left: x + 'px' }) }
				class="tooltip"
				popover="manual"
			>
				<s-tooltip>${ this.renderTooltip(node) }</s-tooltip>
			</article>
			`;
		}) }
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			contain: strict;
			display: grid;
			outline: none;
			background-color: rgb(8, 12, 18);
		}
		canvas {
			grid-row: 1/2;
			grid-column: 1/2;
		}
		canvas#background {
			opacity: 0.5;
			z-index: 0;
			/*visibility: hidden;*/
		}
		canvas#main {
			z-index: 1;
			/*visibility: hidden;*/
		}
		article.tooltip:popover-open {
			${ unsetPopover }
			position: absolute;
			display: grid;
			place-items: center start;
		}
		s-tooltip {
			position: absolute;
			display: block;
			width: max-content;
		}
	`;

}
