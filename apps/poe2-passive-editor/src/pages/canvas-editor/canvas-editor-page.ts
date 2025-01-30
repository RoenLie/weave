import { html } from 'lit-html';
import { css, CustomElement, type CSSStyle } from '../../app/custom-element.ts';
import type { Vec2 } from '@roenlie/core/types';
import { tuple } from '@roenlie/core/array';


export class PoeCanvasTree extends CustomElement {

	static { this.register('poe-canvas-editor'); }

	protected bgCanvas:    HTMLCanvasElement;
	protected bgContext:   CanvasRenderingContext2D;
	protected mainCanvas:  HTMLCanvasElement;
	protected mainContext: CanvasRenderingContext2D;
	protected image:       HTMLImageElement;
	protected imageVec:    Vec2 = { x: 0, y: 0 };
	protected objects:     any[] = [];
	protected bgView:      View = new View();
	protected mainView:    View = new View();

	protected resizeObserver = new ResizeObserver(entries => {
		if (!this.image)
			return;

		const entry = entries[0]!;

		const parentWidth = entry.contentRect.width;
		const parentHeight = entry.contentRect.height;

		this.mainCanvas.width = parentWidth;
		this.mainCanvas.height = parentHeight;
		this.bgCanvas.width = parentWidth;
		this.bgCanvas.height = parentHeight;

		this.bgView.apply();
		this.mainView.apply();

		this.renderBgCanvasContent();
		this.renderMainCanvasContent();
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

		const randI = (min: number, max = min + (min = 0)) =>
			(Math.random() * (max - min) + min) | 0;

		const rand = (min: number, max = min + (min = 0)) =>
			Math.random() * (max - min) + min;

		for (let i = 0; i < 100; i++) {
			this.objects.push({
				x:   rand(this.mainCanvas.width),
				y:   rand(this.mainCanvas.height),
				w:   rand(40),
				h:   rand(40),
				col: `rgb(${ randI(255) },${ randI(255) },${ randI(255) })`,
			});
		}

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
		this.boundDraw();
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
		};
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);
		};

		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);
	}

	protected drawBackgroundCanvas() {
		const { bgView, bgCanvas, bgContext } = this;

		if (this.image && this.bgView.isDirty()) { // has the view changed, then draw all
			bgContext.setTransform(1, 0, 0, 1, 0, 0); // default transform for clear
			bgContext.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
			bgView.apply(); // set the 2D context transform to the view

			this.renderBgCanvasContent();
		}
	}

	protected drawMainCanvas() {
		const { mainView, mainContext, mainCanvas } = this;

		if (this.mainView.isDirty()) { // has the view changed, then draw all
			mainContext.setTransform(1, 0, 0, 1, 0, 0); // default transform for clear
			mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
			mainView.apply(); // set the 2D context transform to the view

			this.renderMainCanvasContent();
		}
	}

	protected renderBgCanvasContent() {
		const { bgContext } = this;
		bgContext.drawImage(this.image, this.imageVec.x, this.imageVec.y);
	}

	protected renderMainCanvasContent() {
		const { objects, mainContext } = this;

		for (const obj of objects) {
			mainContext.fillStyle = obj.col;
			mainContext.fillRect(obj.x, obj.y, obj.h, obj.h);
		}
	}

	protected boundDraw = () => {
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

	public apply() {
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
