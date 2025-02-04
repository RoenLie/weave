import { tuple } from '@roenlie/core/array';
import type { Vec2 } from '@roenlie/core/types';
import type { Viewport } from './is-outside-viewport.ts';


export class View {

	public viewport: Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };
	protected matrix = tuple(1, 0, 0, 1, 0, 0); // current view transform
	protected pos:   Vec2 = { x: 0, y: 0 }; // current position of origin
	protected ctx:   CanvasRenderingContext2D; // reference to the 2D context
	protected scale: number = 1; // current scale
	protected dirty: boolean = true;


	public setContext(context: CanvasRenderingContext2D) {
		this.ctx = context;
		this.dirty = true;
	};

	/** Sets canvas width and height. */
	public setCanvasSize(width: number, height: number) {
		this.ctx.canvas.width = width;
		this.ctx.canvas.height = height;

		this.applyTransform();
	}

	/** Calculates the current viewport dimensions for the view. */
	protected updateViewport(): void {
		const { x, y } = this.getPosition();
		const scale = this.getScale();

		const viewableWidth = this.ctx.canvas.width;
		const viewableHeight = this.ctx.canvas.height;

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

		const { matrix: m, ctx } = this;
		ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);

		this.updateViewport();
	};

	public getVisiblePercentage(width: number, height: number): number {
		const totalArea    = width * height;
		const viewportArea = (this.viewport.x2 - this.viewport.x1)
			* (this.viewport.y2 - this.viewport.y1);

		const percentage = (viewportArea / totalArea) * 100;

		return percentage;
	}

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
