import { nanoid } from 'nanoid';


export interface ITrackedPromise<T> extends Promise<T> {
	id: string;
	done: boolean;
	value?: T;
	resolve: (value?: T) => void;
	reject: () => void;
}

export type ITrackedPromiseConstructor = {
	new<T>(
		executor?: (
			resolve: (value: T) => void,
			reject: (reason?: any) => void
		) => void,
		initialValue?: T,
	): ITrackedPromise<T>;

	resolve<T>(value: T): ITrackedPromise<T>;
	resolve<T>(): ITrackedPromise<T>;
};


export const TrackedPromise = function<T>(
	this: ITrackedPromise<T>,
	executor?: ConstructorParameters<PromiseConstructorLike>[0],
	initialValue?: T,
) {
	let id = nanoid();
	let resolver: (value?: any) => void = () => {};
	let rejector: () => void = () => {};

	const promise = new Promise<T>((resolve, reject) => {
		resolver = (value: T) => {
			promise.done = true;
			promise.value = value;
			resolve(value);
		};

		rejector = (reason?: any) => {
			promise.done = true;
			reject(reason);
		};
	}) as ITrackedPromise<T>;

	Object.assign(promise, {
		id,
		done:    false,
		value:   initialValue,
		resolve: resolver,
		reject:  rejector,
	});

	executor?.(resolver, rejector);

	return promise;
} as unknown as ITrackedPromiseConstructor;


TrackedPromise.resolve = <T>(value?: T) => {
	let promise = new TrackedPromise<T>(() => {});
	promise.done = true;
	promise.resolve(value);

	return promise;
};
