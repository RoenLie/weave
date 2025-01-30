import { html } from 'lit-html';
import { css, CustomElement, type CSSStyle } from '../../app/custom-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { tuple } from '@roenlie/core/array';
import { Connection, GraphNode, type StorableConnection, type StorableGraphNode } from '../../app/graph.ts';
import graph from '../../app/tree.json' with { type: 'json'};
import { isOutsideViewport, type Viewport } from '../../app/is-outside-viewport.ts';
import { debounce } from '@roenlie/core/timing';


export class PoeCanvasTree extends CustomElement {

	static { this.register('poe-canvas-editor'); }

	protected bgCanvas:    HTMLCanvasElement;
	protected bgContext:   CanvasRenderingContext2D;
	protected mainCanvas:  HTMLCanvasElement;
	protected mainContext: CanvasRenderingContext2D;
	protected image:       HTMLImageElement;
	protected imageVec:    Vec2 = { x: 0, y: 0 };
	protected objects:     any[] = [];
	protected nodes:       Map<string, GraphNode> = new Map();
	protected connections: Map<string, Connection> = new Map();
	protected viewport:    Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };
	protected pauseRender: boolean = false;

	protected readonly bgView:   View = new View();
	protected readonly mainView: View = new View();
	protected readonly resizeObserver = new ResizeObserver(entries => {
		if (!this.image)
			return;

		this.pauseRender = true;

		const entry = entries[0]!;
		const width = entry.contentRect.width;
		const height = entry.contentRect.height;

		this.mainCanvas.width = width;
		this.mainCanvas.height = height;
		this.bgCanvas.width = width;
		this.bgCanvas.height = height;

		this.bgView.applyTransform();
		this.mainView.applyTransform();

		this.renderBgCanvasContent();
		this.renderMainCanvasContent();

		this.debouncedEnableRender();
	});

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.resizeObserver.unobserve(this);
	}

	protected override afterConnected(): void {
		super.afterConnected();

		this.resizeObserver.observe(this);

		this.mainCanvas = this.shadowRoot!.querySelector('#main') as HTMLCanvasElement;
		this.mainContext = this.mainCanvas.getContext('2d') as CanvasRenderingContext2D;
		this.mainCanvas.width = this.offsetWidth;
		this.mainCanvas.height = this.offsetHeight;

		this.bgCanvas = this.shadowRoot!.querySelector('#background') as HTMLCanvasElement;
		this.bgContext = this.bgCanvas.getContext('2d') as CanvasRenderingContext2D;
		this.bgCanvas.width = this.offsetWidth;
		this.bgCanvas.height = this.offsetHeight;

		this.connections = new Map(graph.connections.map(
			(con: StorableConnection) => {
				const parsed = new Connection(con);

				return [ parsed.id, parsed ];
			},
		));

		this.nodes = new Map(graph.nodes.map(
			(node: StorableGraphNode) => {
				const parsed = new GraphNode(node);
				parsed.x -= 1457;
				parsed.y -= 1614;

				return [ parsed.id, parsed ];
			},
		));


		const img = new Image();
		img.onload = () => {
			this.image = img;

			const parentWidth = this.offsetWidth;
			const parentHeight = this.offsetHeight;
			const y = parentHeight / 2 - this.image.naturalHeight / 2;
			const x = parentWidth / 2 - this.image.naturalWidth / 2;

			this.imageVec = { x, y };
		};
		img.src = '/poe2-tree.png';

		this.bgView.setContext(this.bgContext);
		this.mainView.setContext(this.mainContext);
		this.viewport = this.getViewport();
		this.boundDraw();
	}

	protected debouncedEnableRender = debounce(() => {
		this.pauseRender = false;
	}, 500);

	protected getViewport(): Viewport {
		const { x, y } = this.mainView.getPosition();
		const scale = this.mainView.getScale();

		const viewableWidth = this.offsetWidth;
		const viewableHeight = this.offsetHeight;

		const x1 = -x / scale;
		const y1 = -y / scale;
		const x2 = x1 + (viewableWidth / scale);
		const y2 = y1 + (viewableHeight / scale);

		return { x1, x2, y1, y2 };
	}

	protected onMousewheel(event: WheelEvent) {
		const e = event;
		const x = e.offsetX;
		const y = e.offsetY;

		const delta = -e.deltaY;
		if (delta > 0) {
			this.bgView.scaleAt({ x, y }, 1.1);
			this.mainView.scaleAt({ x, y }, 1.1);
		}
		else {
			this.bgView.scaleAt({ x, y }, 1 / 1.1);
			this.mainView.scaleAt({ x, y }, 1 / 1.1);
		}

		this.viewport = this.getViewport();

		e.preventDefault();
	}

	protected onMousedown(ev: MouseEvent) {
		ev.preventDefault();

		// Get the offset from the corner of  the current view to the mouse position
		const x = ev.offsetX - this.mainView.getPosition().x;
		const y = ev.offsetY - this.mainView.getPosition().y;

		const mousemove = (ev: MouseEvent) => {
			this.bgView.moveTo(ev.offsetX - x, ev.offsetY - y);
			this.mainView.moveTo(ev.offsetX - x, ev.offsetY - y);
			this.viewport = this.getViewport();
		};
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);
		};

		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);
	}

	protected drawBackgroundCanvas() {
		const { bgView, bgContext, bgCanvas: { width, height } } = this;

		if (this.bgView.isDirty()) {
			bgContext.setTransform(1, 0, 0, 1, 0, 0);
			bgContext.clearRect(0, 0, width, height);
			bgView.applyTransform();
		}

		if (this.image)
			this.renderBgCanvasContent();
	}

	protected drawMainCanvas() {
		const { mainView, mainContext, mainCanvas: { width, height } } = this;

		if (this.mainView.isDirty()) {
			mainContext.setTransform(1, 0, 0, 1, 0, 0);
			mainContext.clearRect(0, 0, width, height);
			mainView.applyTransform();
		}

		this.renderMainCanvasContent();
	}

	protected renderBgCanvasContent() {
		const { bgContext } = this;
		bgContext.drawImage(this.image, this.imageVec.x, this.imageVec.y);
	}

	protected renderMainCanvasContent() {
		const { nodes, mainContext } = this;

		for (const node of nodes.values()) {
			if (isOutsideViewport(this.viewport, node))
				continue;

			mainContext.beginPath();
			mainContext.arc(node.x, node.y, node.radius, 0, 2 * Math.PI, false);
			mainContext.lineWidth = 1;
			mainContext.strokeStyle = 'silver';
			mainContext.stroke();
		}
	}

	protected boundDraw = () => {
		if (this.pauseRender)
			return requestAnimationFrame(this.boundDraw);

		this.drawBackgroundCanvas();
		this.drawMainCanvas();

		requestAnimationFrame(this.boundDraw);
	};

	protected override render(): unknown {
		return html`
		<canvas id="background"></canvas>
		<canvas
			id="main"
			@mousedown=${ this.onMousedown }
			@mousewheel=${ this.onMousewheel }
		></canvas>
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			contain: strict;
			display: grid;
		}
		canvas {
			grid-row: 1/2;
			grid-column: 1/2;
			width: 100%;
			height: 100%;
		}
	`;

}


class View {

	protected matrix = tuple(1, 0, 0, 1, 0, 0); // current view transform
	protected pos: Vec2 = { x: 0, y: 0 }; // current position of origin

	protected ctx: CanvasRenderingContext2D; // reference to the 2D context
	protected scale = 1; // current scale
	protected dirty = true;

	public setContext(context: CanvasRenderingContext2D) {
		this.ctx = context;
		this.dirty = true;
	};

	/** set the 2D context transform to the view */
	public applyTransform() {
		if (this.dirty)
			this.update();

		const { matrix: m, ctx } = this;
		ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
	};

	public getScale() { return this.scale; };
	public getPosition() { return this.pos; }
	public markDirty() { this.dirty = true; }
	public isDirty() { return this.dirty; }
	public update() {
		const { matrix: m, scale, pos } = this;

		this.dirty = false;
		m[3] = m[0] = scale;
		m[2] = m[1] = 0;
		m[4] = pos.x;
		m[5] = pos.y;
	};

	public scaleAt(at: Vec2, amount: number) {
		if (this.dirty)
			this.update();

		this.scale *= amount;
		this.pos.x = at.x - (at.x - this.pos.x) * amount;
		this.pos.y = at.y - (at.y - this.pos.y) * amount;
		this.dirty = true;
	};

	public moveTo(x: number, y: number) {
		if (this.dirty)
			this.update();

		this.pos.x = x;
		this.pos.y = y;
		this.dirty = true;
	};

}
