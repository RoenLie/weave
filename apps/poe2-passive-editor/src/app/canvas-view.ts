import type { Vec2 } from '@roenlie/core/types';
import type { Viewport } from './is-outside-viewport.ts';


export class View {

	public ctx:             ImageBitmapRenderingContext;
	public canvas:          HTMLCanvasElement;
	public offscreenCanvas: OffscreenCanvas;
	public offscreenCtx:    OffscreenCanvasRenderingContext2D;
	public viewport:        Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };

	protected matrix = new DOMMatrix([ 1, 0, 0, 1, 0, 0 ]);
	protected pos:   Vec2 = { x: 0, y: 0 };
	protected scale: number = 1;
	protected dirty: boolean = true;

	public setContext(canvas: HTMLCanvasElement) {
		this.dirty = true;

		this.canvas = canvas;
		this.offscreenCanvas = canvas.transferControlToOffscreen();
		this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
	};

	/** Sets canvas width and height. */
	public setCanvasSize(width: number, height: number) {
		this.offscreenCanvas.width = width;
		this.offscreenCanvas.height = height;

		this.applyTransform();
	}

	/** Calculates the current viewport dimensions for the view. */
	protected updateViewport(): void {
		const { x, y } = this.getPosition();
		const scale = this.getScale();

		const viewableWidth = this.offscreenCanvas.width;
		const viewableHeight = this.offscreenCanvas.height;

		const x1 = -x / scale;
		const y1 = -y / scale;
		const x2 = x1 + (viewableWidth / scale);
		const y2 = y1 + (viewableHeight / scale);

		this.viewport = { x1, x2, y1, y2 };
	}

	/** set the 2D context transform to the view */
	public applyTransform() {
		if (this.dirty)
			this.update();

		const { matrix: m, offscreenCtx } = this;
		offscreenCtx.setTransform(m);

		this.updateViewport();
	};

	public clearContext() {
		const  { width, height } = this.offscreenCanvas;
		this.offscreenCtx.resetTransform();
		this.offscreenCtx.clearRect(0, 0, width, height);
		this.applyTransform();
	}

	public update() {
		const { matrix: m, scale, pos } = this;

		m.d = m.a = scale;
		m.c = m.b = 0;
		m.e = pos.x;
		m.f = pos.y;

		this.dirty = false;
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

	public getScale() { return this.scale; };
	public getPosition() { return this.pos; }
	public isDirty() { return this.dirty; }
	public getVisiblePercentage(width: number, height: number): number {
		const totalArea    = width * height;
		const viewportArea = (this.viewport.x2 - this.viewport.x1)
			* (this.viewport.y2 - this.viewport.y1);

		const percentage = (viewportArea / totalArea) * 100;

		return percentage;
	}

}


export class ImmediateOrDebounced<T extends () => void> {

	constructor(fn: T) {
		this.immediate = fn;
		this.debounced = (() => void requestAnimationFrame(fn)) as T;
	}

	public immediate: T;
	public debounced: T;

}
