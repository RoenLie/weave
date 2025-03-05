import type { ImageWorkerApiIn, ImageWorkerApiOut } from './worker-api.ts';
import { createPostMessage, createWorkerOnMessage } from './worker-interface.ts';
import { WorkerView } from './worker-view.ts';


class ImageWorker {

	public onmessage = createWorkerOnMessage(this);
	protected post = createPostMessage<ImageWorkerApiOut>();
	protected view:   WorkerView;
	protected bitmap: ImageBitmap;


	//#region API
	public initialize(data: ImageWorkerApiIn['initialize']['args']) {
		this.view = new WorkerView(data.canvas);
	}

	public setSize(data: ImageWorkerApiIn['setSize']['args']) {
		this.view.setCanvasSize(data.width, data.height);
		this.draw();
	}

	public scaleAt(data: ImageWorkerApiIn['scaleAt']['args']) {
		this.view.scaleAt(data.vec, data.factor);
		this.draw();
	}

	public moveTo(data: ImageWorkerApiIn['moveTo']['args']) {
		this.view.moveTo(data.x, data.y);
		this.draw();
	}

	public setImage(data: ImageWorkerApiIn['setImage']['args']) {
		this.bitmap = data.image;

		this.centerViewOnImage();

		this.draw();
	}

	public mousedown(data: ImageWorkerApiIn['mousedown']['args']) {
		const event = data.event;

		// Get the offset from the corner of the current view to the mouse position
		const position = this.view.position;
		const viewOffsetX = event.offsetX - position.x;
		const viewOffsetY = event.offsetY - position.y;

		this.post.startViewMove({
			initialMouseX: event.offsetX,
			initialMouseY: event.offsetY,
			offsetX:       viewOffsetX,
			offsetY:       viewOffsetY,
		});
	}

	public touchstart(data: ImageWorkerApiIn['touchstart']['args']) {
		const offsetX = data.touches[0]!.pageX - data.rect.left;
		const offsetY = data.touches[0]!.pageY - data.rect.top;

		// Get the offset from the corner of the current view to the mouse position
		const position = this.view.position;
		const viewOffsetX = offsetX - position.x;
		const viewOffsetY = offsetY - position.y;

		this.post.startViewTouchMove({
			initialMouseX: offsetX,
			initialMouseY: offsetY,
			offsetX:       viewOffsetX,
			offsetY:       viewOffsetY,
			scale:         this.view.scaleFactor,
		});
	}
	//#endregion


	protected draw() {
		if (!this.bitmap)
			return;

		this.view.clearContext();
		this.view.context.drawImage(this.bitmap, 0, 0);
	}

	protected centerViewOnImage() {
		if (!this.bitmap)
			return;

		const imageHeight = this.bitmap.height;
		const imageWidth = this.bitmap.width;

		const parentWidth = this.view.canvas.width;
		const parentHeight = this.view.canvas.height;
		const y = parentHeight / 2 - imageHeight / 2;
		const x = parentWidth  / 2 - imageWidth  / 2;

		this.view.moveTo(x, y);
	}

}


const host = new ImageWorker();
self.onmessage = host.onmessage;
