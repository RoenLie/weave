import type { Vec2 } from '@roenlie/core/types';
import type { Viewport } from './is-outside-viewport.ts';


export class View {

	public canvas:   OffscreenCanvas;
	public context:  OffscreenCanvasRenderingContext2D;
	public viewport: Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };
	public visiblePercentage = 0;

	protected totalArea = 0;
	protected viewportArea = 0;
	protected dirty: boolean = true;
	protected matrix = new DOMMatrix([ 1, 0, 0, 1, 0, 0 ]);

	public get position(): Vec2 { return this._position; }
	protected _position: Vec2 = { x: 0, y: 0 };

	public get scale(): number { return this._scale; }
	protected _scale: number = 1;

	/** Sets the canvas and transfers control to the internal offscreen canvas. */
	public setContext(canvas: HTMLCanvasElement) {
		this.canvas = canvas.transferControlToOffscreen();
		this.context = this.canvas.getContext('2d')!;
	};

	/** Sets canvas width and height. */
	public setCanvasSize(width: number, height: number) {
		this.canvas.width = width;
		this.canvas.height = height;

		this.applyTransform();
	}

	/** Sets the total area, used for calculating visible area percentage. */
	public setTotalArea(width: number, height: number) {
		this.totalArea = width * height;
	}

	/** Resets the canvas transform, clears the canvas and reapplies the transform. */
	public clearContext() {
		const { width, height } = this.canvas;
		this.context.resetTransform();
		this.context.clearRect(0, 0, width, height);
		this.applyTransform();
	}

	/** set the 2D context transform to the view */
	public applyTransform() {
		const { matrix, context } = this;
		context.setTransform(matrix);

		this.updateViewport();
	};

	/** Calculates the current viewport dimensions for the view. */
	protected updateViewport(): void {
		const { x, y } = this._position;
		const { width, height } = this.canvas;

		const x1 = -x / this._scale;
		const y1 = -y / this._scale;
		const x2 = x1 + (width / this._scale);
		const y2 = y1 + (height / this._scale);

		this.viewport = { x1, x2, y1, y2 };

		this.viewportArea = (this.viewport.x2 - this.viewport.x1)
				* (this.viewport.y2 - this.viewport.y1);

		this.visiblePercentage = (this.viewportArea / this.totalArea) * 100;
	}

	/** Scales the context in the direction of the vector. */
	public scaleAt(vec: Vec2, factor: number) {
		this._scale *= factor;
		this._position.x = vec.x - (vec.x - this._position.x) * factor;
		this._position.y = vec.y - (vec.y - this._position.y) * factor;
		this.updateMatrix();
	};

	/** Translates the context. */
	public moveTo(x: number, y: number) {
		this._position.x = x;
		this._position.y = y;
		this.updateMatrix();
	};

	/** Applies the pending changes to the matrix. */
	public updateMatrix() {
		const { matrix: m, _scale, _position } = this;

		m.d = m.a = _scale;
		m.c = m.b = 0;
		m.e = _position.x;
		m.f = _position.y;
	};

}


/**
 * Returns a version of the supplied function that is locked to not run faster
 * than the consumers frame-rate
 */
export const frameLocked = <T extends () => void>(fn: T) => {
	return () => void requestAnimationFrame(fn);
};
