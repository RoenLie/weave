type WorkerComs = Record<string, {
	args:       Record<string, any>;
	serialize?: any[];
}>;

export type WorkerApi<T extends WorkerComs> = {
	[Key in keyof T]: T[Key]['serialize'] extends object
		? (args: T[Key]['args'], serialize: T[Key]['serialize']) => void
		: (args: T[Key]['args']) => void
};


export const type = <T>(): T => undefined as any;
export const createWorkerApi = <const T extends WorkerComs>(api: T): T => api;


//#region main-thread
export const createWorkerProxy = <T extends WorkerComs>(
	ctor: new() => Worker, api: T,
): Worker & WorkerApi<T> => {
	const proxy = new Proxy(new ctor(), {
		get(target: Worker & Record<keyof any, any>, prop, receiver) {
			if (typeof target[prop] === 'function')
				return target[prop].bind(target);

			if (prop in api) {
				return (args: any, serialize?: Transferable[]) => {
					const message = { ...args, type: prop };

					if (serialize)
						target.postMessage(message, serialize);
					else
						target.postMessage(message);
				};
			}

			return Reflect.get(target, prop, receiver);
		},
	});

	return proxy as Worker & WorkerApi<T>;
};
//#endregion main-thread


//#region worker
export const createWorkerOnMessage = <T>(cls: T) => {
	return (ev: MessageEvent) => {
		const fn = cls[ev.data.type as keyof T];
		if (typeof fn !== 'function')
			return console.error(`Unknown message type: ${ ev.data.type }`);

		fn.call(cls, ev.data);
	};
};

export const createPostMessage = <T extends WorkerComs>(): WorkerApi<T> => {
	const proxy = new Proxy({} as any, {
		get: (_, prop: Extract<keyof T, string>) => {
			return (args: T[keyof T], serialize?: Transferable[]) => {
				const message = { ...args, type: prop };

				if (serialize)
					postMessage(message, { transfer: serialize });
				else
					postMessage(message);
			};
		},
	});

	return proxy as WorkerApi<T>;
};
//#endregion worker


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
