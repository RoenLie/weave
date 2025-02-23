import type { CanvasEditorWorkerApiIn } from './editor-implementation.ts';
import type { CanvasReaderWorkerApiIn } from './reader-implementation.ts';


type WorkerApi<T> = { [key in keyof T]: (data: Omit<T[key], 'type'>) => void; };

export type CanvasReaderWorkerMethods = WorkerApi<CanvasReaderWorkerApiIn> & {
	init: (bg: HTMLCanvasElement, main: HTMLCanvasElement, bitmap: HTMLCanvasElement) => void;
};

export type CanvasEditorWorkerMethods = WorkerApi<CanvasEditorWorkerApiIn> & {
	init: (bg: HTMLCanvasElement, main: HTMLCanvasElement, bitmap: HTMLCanvasElement) => void;
};

export const createCanvasWorker = <T extends object>(ctor: new() => Worker): Worker & T => {
	const proxy = new Proxy(new ctor(), {
		get(target: Worker & Record<keyof any, any>, p, receiver) {
			if (typeof target[p] === 'function')
				return target[p].bind(target);

			if (p === 'init') {
				return (bgCanvas: HTMLCanvasElement, mainCanvas: HTMLCanvasElement, bitmap: HTMLCanvasElement) => {
					const bgOffscreen = bgCanvas.transferControlToOffscreen();
					const mainOffscreen = mainCanvas.transferControlToOffscreen();
					const bitmapOffscreen = bitmap.transferControlToOffscreen();

					target.postMessage(
						{ type: 'init', bg: bgOffscreen, main: mainOffscreen, bitmap: bitmapOffscreen },
						[ bgOffscreen, mainOffscreen, bitmapOffscreen ],
					);
				};
			}

			if (!Reflect.has(target, p))
				return (args: any) => target.postMessage({ ...args, type: p });

			return Reflect.get(target, p, receiver);
		},
	});

	return proxy as Worker & T;
};


export type PostMessageApi<T> = {
	[key in keyof T]: (data: Omit<T[key], 'type'>) => void;
};

export const createPostMessage = <T extends object>() => {
	const proxy = new Proxy({} as any, {
		get: (_, prop: Extract<keyof T, string>) =>
			(args: T[keyof T]) => postMessage({ ...args, type: prop }),
	});

	return proxy as PostMessageApi<T>;
};


export type WorkerImplement<T extends object> = {
	[key in keyof T]: (args: T[key]) => void;
};


export type MakeObjectTransferable<T extends object> = {
	-readonly [Key in keyof T as T[Key] extends (string | number | boolean) ? Key : never]: T[Key];
};


export type TransferableWheelEvent = MakeObjectTransferable<WheelEvent>;
export type TransferableMouseEvent = MakeObjectTransferable<MouseEvent>;
export type TransferableTouchEvent = MakeObjectTransferable<TouchEvent>;
export type TransferableTouches = MakeObjectTransferable<TouchEvent['touches'][number]>;
export type TransferableKeyboardEvent = MakeObjectTransferable<KeyboardEvent>;

export const makeObjectTransferable = <T extends object>(obj: T): MakeObjectTransferable<T> => {
	const cloned = {} as MakeObjectTransferable<T>;
	for (const key in obj) {
		const value = obj[key as keyof typeof obj]!;
		const type = typeof value;
		if (type === 'string' || type === 'number' || type === 'boolean')
			(cloned as any)[key] = value;
	}

	return cloned;
};
