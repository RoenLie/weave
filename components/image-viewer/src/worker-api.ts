import type { Vec2 } from '@roenlie/core/types';
import { createWorkerApi, type, type TransferableMouseEvent, type TransferableTouches, type TransferableTouchEvent } from './worker-interface.ts';


export const workerApiIn = createWorkerApi({
	initialize: {
		args: {
			canvas: type<OffscreenCanvas>(),
		},
		serialize: [ type<OffscreenCanvas>() ],
	},
	setSize: {
		args: {
			width:  type<number>(),
			height: type<number>(),
		},
	},
	scaleAt: {
		args: {
			vec:    type<Vec2>(),
			factor: type<number>(),
		},
	},
	moveTo: {
		args: {
			x: type<number>(),
			y: type<number>(),
		},
	},
	setImage: {
		args: {
			image: type<ImageBitmap>(),
		},
		serialize: [ type<ImageBitmap>() ],
	},
	clearImage: {
		args: {},
	},
	reset: {
		args: {},
	},
	fitToView: {
		args: {},
	},
	rotate: {
		args: {
			degrees: type<number>(),
		},
	},
	zoom: {
		args: {
			factor: type<number>(),
		},
	},
	mousedown: {
		args: {
			event: type<TransferableMouseEvent>(),
		},
	},
	touchstart: {
		args: {
			event:   type<TransferableTouchEvent>(),
			touches: type<TransferableTouches[]>(),
			rect:	   type<DOMRect>(),
		},
	},
});

export type ImageWorkerApiIn = typeof workerApiIn;
export type ImageWorkerApiInImp = {
	[key in keyof ImageWorkerApiIn]: (data: ImageWorkerApiIn[key]['args']) => void;
};


export const workerApiOut = createWorkerApi({
	startViewMove: {
		args: {
			initialMouseX: type<number>(),
			initialMouseY: type<number>(),
			offsetX:       type<number>(),
			offsetY:       type<number>(),
		},
	},
	startViewTouchMove: {
		args: {
			initialMouseX: type<number>(),
			initialMouseY: type<number>(),
			offsetX:       type<number>(),
			offsetY:       type<number>(),
			scale:         type<number>(),
		},
	},
});

export type ImageWorkerApiOut = typeof workerApiOut;
export type ImageWorkerApiOutImp = {
	[key in keyof ImageWorkerApiOut]: (data: ImageWorkerApiOut[key]['args']) => void;
};
