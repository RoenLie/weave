import { WorkerView } from '@roenlie/core/canvas';
import { type ImageWorkerApiInImp, type ImageWorkerApiIn, type ImageWorkerApiOut } from './worker-api.ts';
import { createPostMessage, createWorkerOnMessage } from './worker-interface.ts';


class ImageWorker implements ImageWorkerApiInImp {

	public onmessage = createWorkerOnMessage(this);
	protected post = createPostMessage<ImageWorkerApiOut>();
	protected view:   WorkerView;
	protected bitmap: ImageBitmap | undefined;


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
		this.view.setImage(data.image);
		this.view.centerImage();
		this.draw();
	}

	public clearImage(_data: ImageWorkerApiIn['clearImage']['args']) {
		this.bitmap = undefined;
		this.view.setImage(undefined);
		this.draw();
	}

	public reset(_data: ImageWorkerApiIn['reset']['args']) {
		this.view.reset();
		this.draw();
	}

	public fitToView(_data: ImageWorkerApiIn['fitToView']['args']) {
		this.view.fitToView();
		this.draw();
	}

	public rotate(data: ImageWorkerApiIn['rotate']['args']) {
		this.view.rotate(data.degrees);
		this.draw();
	}

	public zoom(data: ImageWorkerApiIn['zoom']['args']) {
		this.view.scale(data.factor);
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
	//#endregion API


	protected draw() {
		if (!this.bitmap)
			return this.view.clearContext();

		this.view.clearContext();
		this.view.context.drawImage(this.bitmap, 0, 0);
	}

}


const host = new ImageWorker();
self.onmessage = host.onmessage;

// Notify the main thread that the worker is ready
postMessage({ type: 'ready' });
