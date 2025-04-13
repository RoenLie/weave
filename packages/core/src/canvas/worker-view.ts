import type { Vec2 } from '../types/data-structure.types.ts';


export interface Viewport { x1: number; x2: number; y1: number; y2: number; }


/**
 * Manages view transformations for canvas-based image display.\
 * Handles scaling, rotation, translation, and viewport calculations
 * without managing the actual rendering.
 */
export class WorkerView {

	protected static readonly TRANSFORM_THRESHOLD = 50;
	protected static readonly SCALE_MIN = 0.1;
	protected static readonly SCALE_MAX = 7;
	protected static readonly SCALE_NORMALIZATION_TOLERANCE = 0.1;
	protected static readonly NORMAL_SCALE_LOWER_BOUND = 0.9;
	protected static readonly NORMAL_SCALE_UPPER_BOUND = 1.1;
	protected static readonly SMOOTHING_SCALE_THRESHOLD = 1.0;

	constructor(canvas: OffscreenCanvas) {
		this.canvas = canvas;
		this.context = this.canvas.getContext('2d')!;
	}

	readonly canvas:  OffscreenCanvas;
	readonly context: OffscreenCanvasRenderingContext2D;

	get viewport(): Viewport { return this._viewport; }
	protected _viewport: Viewport = { x1: 0, x2: 0, y1: 0, y2: 0 };

	get visiblePercentage(): number { return this._visiblePercentage; }
	protected _visiblePercentage: number = 0;

	get position(): Vec2 { return this._position; }
	protected _position: Vec2 = { x: 0, y: 0 };

	get scaleFactor(): number { return this._scaleFactor; }
	protected _scaleFactor: number = 1;

	get rotation(): number { return this._rotation; }
	protected _rotation: number = 0;

	protected totalArea:      number = 0;
	protected viewportArea:   number = 0;
	protected dirty:          boolean = true;
	protected matrix:         DOMMatrix = new DOMMatrix([ 1, 0, 0, 1, 0, 0 ]);
	protected transformCount: number = 0;
	protected image?:         ImageBitmap;

	/**
	 * Sets the size of the canvas element.
	 * @param width The new width of the canvas
	 * @param height The new height of the canvas
	 */
	setCanvasSize(width: number, height: number): void {
		this.canvas.width = width;
		this.canvas.height = height;
	}

	/**
	 * Sets the image to be displayed in the view.
	 * @param image The image to display
	 */
	setImage(image?: ImageBitmap): void {
		this.image = image;
	}

	/**
	 * Sets the total area of the view.
	 * This is used to calculate the visible percentage.
	 * @param width The width of the total area
	 * @param height The height of the total area
	*/
	setTotalArea(width: number, height: number): void {
		this.totalArea = width * height;
	}

	/**
	 * Resets the view to its default state.
	 * This includes resetting the position, scale, and rotation.
	 * If an image is present, it will be centered.
	 */
	reset(): void {
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
	centerImage(): void {
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
	}

	/**
	 * Fits the current image to the view,
	 * centering it and scaling it to fit within the viewport.
	 */
	fitToView(): void {
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

	/**
	 * Clears the canvas context and resets the transformation matrix.
	 * This method should be called before drawing new content.
	 */
	clearContext(): void {
		const { width, height } = this.canvas;
		this.context.resetTransform();
		this.context.clearRect(0, 0, width, height);

		this.applyTransform();
	}

	/**
	 * Scales the view by a factor from the specified point.
	 * @param vec The point to scale from
	 * @param factor The new scale factor (between SCALE_MIN and SCALE_MAX)
	 */
	scaleAt(vec: Vec2, factor: number): void {
		const newScale = this._scaleFactor * factor;
		if (newScale < WorkerView.SCALE_MIN || WorkerView.SCALE_MAX < newScale)
			return;

		const previousScale = this._scaleFactor;

		// Update scale and position
		this._scaleFactor = newScale;
		this._position.x = vec.x - (vec.x - this._position.x) * factor;
		this._position.y = vec.y - (vec.y - this._position.y) * factor;

		// Enable or disable image smoothing based on scale factor
		const useImageSmoothing = this._scaleFactor >= WorkerView.SMOOTHING_SCALE_THRESHOLD;
		if (this.context.imageSmoothingEnabled !== useImageSmoothing)
			this.context.imageSmoothingEnabled = useImageSmoothing;

		// Count transformations and normalize periodically
		this.transformCount++;

		const isAboveThreshold = this.transformCount >= WorkerView.TRANSFORM_THRESHOLD;
		const isReturningToNormal = Math.abs(this._scaleFactor - 1.0) < WorkerView.SCALE_NORMALIZATION_TOLERANCE;
		const wasOutsideThreshold =
			   previousScale < WorkerView.NORMAL_SCALE_LOWER_BOUND
			|| previousScale > WorkerView.NORMAL_SCALE_UPPER_BOUND;

		// Normalize the matrix if we have transformed enough or if we are returning to normal scale
		if (isAboveThreshold || (isReturningToNormal && wasOutsideThreshold)) {
			this.normalizeMatrix();
			this.transformCount = 0;
		}
		else {
			this.updateMatrix();
		}
	};

	/**
	 * Scales the view by a factor from the current center.
	 * @param factor The scaling factor (>1 zooms in, <1 zooms out)
	 */
	scale(factor: number): void {
		if (!this.canvas)
			return;

		// Calculate the center of the current viewport
		const centerX = this.canvas.width / 2;
		const centerY = this.canvas.height / 2;

		// Use the existing scaleAt method with the center as the reference point
		this.scaleAt({ x: centerX, y: centerY }, factor);
	}

	/**
	 * Sets the scale factor of the view.
	 * @param factor The new scale factor (between SCALE_MIN and SCALE_MAX)
	 */
	setScale(factor: number): void {
		if (factor < WorkerView.SCALE_MIN || factor > WorkerView.SCALE_MAX)
			return;

		this._scaleFactor = factor;
		this.updateMatrix();
	}

	/**
	 * Moves the view to the specified position.
	 * @param x The new x-coordinate
	 * @param y The new y-coordinate
	*/
	moveTo(x: number, y: number): void {
		this._position.x = x;
		this._position.y = y;

		this.updateMatrix();
	};

	/**
	 * Rotates the view by the specified angle in degrees
	 * @param degrees The angle to rotate by in degrees
	 */
	rotate(degrees: number): void {
		// Normalize angle to keep it between 0 and 360
		this._rotation = (this._rotation + degrees) % 360;
		if (this._rotation < 0)
			this._rotation += 360;

		this.updateMatrix();
	}

	/**
	 * Sets the rotation of the view to the specified angle in degrees.
	 * @param degrees The angle to rotate to in degrees
	 */
	setRotation(degrees: number): void {
		// Normalize angle to keep it between 0 and 360
		this._rotation = degrees % 360;
		if (this._rotation < 0)
			this._rotation += 360;

		this.updateMatrix();
	}

	/**
	 * Updates the transformation matrix based on the current state.\
	 * This method should be called after any changes to the view.\
	 * The matrix is used to apply transformations to the canvas context.\
	 * The order of transformations is scale, rotate, translate.\
	 * The rotation is around the center of the canvas.
	 */
	updateMatrix(): void {
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

	/**
	 * Applies the current transformation matrix to the canvas context.
	 * This method should only be called in the clearContext method.
	 */
	protected applyTransform(): void {
		const { matrix, context } = this;
		context.setTransform(matrix);

		this.updateViewport();
	};

	/**
	 * Updates the viewport area and visible percentage based on the current view.\
	 * This method should only be called after applying the transformation matrix.
	 */
	protected updateViewport(): void {
		const { x, y } = this._position;
		const { width, height } = this.canvas;

		const x1 = -x / this._scaleFactor;
		const y1 = -y / this._scaleFactor;
		const x2 = x1 + (width / this._scaleFactor);
		const y2 = y1 + (height / this._scaleFactor);

		this._viewport = { x1, x2, y1, y2 };

		this.viewportArea = (this._viewport.x2 - this._viewport.x1)
					* (this._viewport.y2 - this._viewport.y1);

		this._visiblePercentage = (this.viewportArea / this.totalArea) * 100;
	}

	/**
	 * Normalizes the transformation matrix to prevent floating point errors.\
	 * The matrix is reset to the identity matrix and then reapplied.
	 */
	protected normalizeMatrix(): void {
		// Reset matrix to identity
		const m = this.matrix;
		m.a = 1; m.b = 0;
		m.c = 0; m.d = 1;
		m.e = 0; m.f = 0;

		// Apply fresh transformation from current state
		this.updateMatrix();
	}

}
