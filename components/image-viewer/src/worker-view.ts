import type { Vec2 } from '@roenlie/core/types';


export interface Viewport { x1: number, x2: number, y1: number, y2: number }


export class WorkerView {

	constructor(canvas: OffscreenCanvas) {
		this.canvas = canvas;
		this.context = this.canvas.getContext('2d')!;
	}

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

	public get scaleFactor(): number { return this._scaleFactor; }
	protected _scaleFactor: number = 1;

	public get rotation(): number { return this._rotation; }
	protected _rotation: number = 0; // Stored in degrees

	protected transformCount = 0;
	protected readonly TRANSFORM_THRESHOLD = 50;

	protected image?: ImageBitmap;

	/** Sets canvas width and height. */
	public setCanvasSize(width: number, height: number) {
		this.canvas.width = width;
		this.canvas.height = height;

		this.applyTransform();
	}

	public setImage(image: ImageBitmap) {
		this.image = image;
	}

	/** Sets the total area, used for calculating visible area percentage. */
	public setTotalArea(width: number, height: number) {
		this.totalArea = width * height;
	}

	/** Resets view to original scale, no rotation, and centered position */
	public reset(): void {
		// Reset rotation
		this._rotation = 0;

		// Reset scale
		this._scaleFactor = 1;

		// Reset to center if we have an image
		if (this.image) {
			this.centerImage();
		}
		else {
			// Default position if no image
			this._position = { x: 0, y: 0 };
		}

		// Apply the transform
		this.normalizeMatrix();
	}

	/** Centers the current image in the viewport */
	public centerImage(): void {
		if (!this.image)
			return;

		const imageWidth = this.image.width;
		const imageHeight = this.image.height;

		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;

		const x = canvasWidth / 2 - imageWidth / 2;
		const y = canvasHeight / 2 - imageHeight / 2;

		this._position = { x, y };

		this.updateMatrix();
		this.applyTransform();
	}

	/** Scales and positions the image to fit in the viewport */
	public fitToView(): void {
		if (!this.image)
			return;

		// Reset rotation for clean fit
		this._rotation = 0;

		const imageWidth = this.image.width;
		const imageHeight = this.image.height;

		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;

		// Calculate scale to fit within viewport
		const scaleX = canvasWidth / imageWidth;
		const scaleY = canvasHeight / imageHeight;

		// Use the smaller scale to ensure the entire image fits
		this._scaleFactor = Math.min(scaleX, scaleY) * 0.95; // 95% to add a small margin

		// Center the scaled image
		const scaledWidth = imageWidth * this._scaleFactor;
		const scaledHeight = imageHeight * this._scaleFactor;

		const x = (canvasWidth - scaledWidth) / 2;
		const y = (canvasHeight - scaledHeight) / 2;

		this._position = { x, y };

		this.normalizeMatrix();
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

		const x1 = -x / this._scaleFactor;
		const y1 = -y / this._scaleFactor;
		const x2 = x1 + (width / this._scaleFactor);
		const y2 = y1 + (height / this._scaleFactor);

		this.viewport = { x1, x2, y1, y2 };

		this.viewportArea = (this.viewport.x2 - this.viewport.x1)
				* (this.viewport.y2 - this.viewport.y1);

		this.visiblePercentage = (this.viewportArea / this.totalArea) * 100;
	}

	/** Scales the context in the direction of the vector. */
	public scaleAt(vec: Vec2, factor: number) {
		const newScale = this._scaleFactor * factor;
		if (newScale < 0.1 || 7 < newScale)
			return;

		const previousScale = this._scaleFactor;

		// Update scale and position
		this._scaleFactor = newScale;
		this._position.x = vec.x - (vec.x - this._position.x) * factor;
		this._position.y = vec.y - (vec.y - this._position.y) * factor;

		// Enable or disable image smoothing based on scale factor
		const imageSmoothing = this._scaleFactor >= 1 ? true : false;
		if (this.context.imageSmoothingEnabled !== imageSmoothing)
			this.context.imageSmoothingEnabled = imageSmoothing;

		// Count transformations and normalize periodically
		this.transformCount++;
		if (this.transformCount >= this.TRANSFORM_THRESHOLD) {
			this.normalizeMatrix();
			this.transformCount = 0;
		}
		// Normalize when returning close to 1.0 scale
		else if (
			(previousScale < 0.9 || previousScale > 1.1)
			&& Math.abs(this._scaleFactor - 1.0) < 0.1
		) {
			this.normalizeMatrix();
		}
		else {
			this.updateMatrix();
		}
	};

	/**
	 * Scales the view by a factor from the current center.
	 * @param factor The scaling factor (>1 zooms in, <1 zooms out)
	 */
	public scale(factor: number): void {
		if (!this.canvas)
			return;

		// Calculate the center of the current viewport
		const centerX = this.canvas.width / 2;
		const centerY = this.canvas.height / 2;

		// Use the existing scaleAt method with the center as the reference point
		this.scaleAt({ x: centerX, y: centerY }, factor);
	}

	public setScale(scale: number) {
		if (scale < 0.1 || scale > 7)
			return;

		this._scaleFactor = scale;
		this.updateMatrix();
		this.applyTransform();
	}

	/** Translates the context. */
	public moveTo(x: number, y: number) {
		this._position.x = x;
		this._position.y = y;

		this.updateMatrix();
	};

	/** Rotates the view by the specified angle in degrees */
	public rotate(degrees: number) {
		// Normalize angle to keep it between 0 and 360
		this._rotation = (this._rotation + degrees) % 360;
		if (this._rotation < 0)
			this._rotation += 360;

		this.updateMatrix();
		this.applyTransform();
	}

	/** Sets the rotation to a specific angle in degrees */
	public setRotation(degrees: number) {
		// Normalize angle to keep it between 0 and 360
		this._rotation = degrees % 360;
		if (this._rotation < 0)
			this._rotation += 360;

		this.updateMatrix();
		this.applyTransform();
	}

	/** Applies the pending changes to the matrix. */
	public updateMatrix() {
		const { matrix: m, _scaleFactor, _position, _rotation } = this;

		// Reset to identity matrix
		m.a = 1; m.b = 0;
		m.c = 0; m.d = 1;
		m.e = 0; m.f = 0;

		// Convert rotation to radians
		const radians = _rotation * (Math.PI / 180);
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);

		// Apply transformations in correct order
		// 1. Apply scale
		m.a = _scaleFactor;
		m.d = _scaleFactor;

		// 2. Apply rotation
		const a = m.a * cos;
		const b = m.a * sin;
		const c = m.d * -sin;
		const d = m.d * cos;

		m.a = a;
		m.b = b;
		m.c = c;
		m.d = d;

		// 3. Apply translation
		// First, apply the base position
		m.e = _position.x;
		m.f = _position.y;

		// Then adjust for rotation around the scaled center point
		if (_rotation !== 0) {
			// Canvas center (point to rotate around)
			// Use the image as the center if we have one.
			const centerX = this.image ? this.image.width / 2 : this.canvas.width / 2;
			const centerY = this.image ? this.image.height / 2 : this.canvas.height / 2;

			const scaledCenterX = centerX * _scaleFactor;
			const scaledCenterY = centerY * _scaleFactor;

			// Rotation correction: translate to ensure rotation happens around the scaled center
			m.e += scaledCenterX - (scaledCenterX * cos - scaledCenterY * sin);
			m.f += scaledCenterY - (scaledCenterX * sin + scaledCenterY * cos);
		}
	};

	public normalizeMatrix() {
		// Reset matrix to identity
		const m = this.matrix;
		m.a = 1; m.b = 0;
		m.c = 0; m.d = 1;
		m.e = 0; m.f = 0;

		// Apply fresh transformation from current state
		this.updateMatrix();
		this.applyTransform();
	}

}
