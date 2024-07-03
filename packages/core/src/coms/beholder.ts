/* eslint-disable @typescript-eslint/no-unused-vars */
import type { stringliteral } from '../types/strings.types.js';


declare global {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface PhenomBeholderMap {}
}


export class Phenomenon<T = any> {

	constructor(
		public type: string,
		public detail: T,
	) {}

}


class Beholder {

	static #beholders = new Map<string, Set<(phenom: Phenomenon) => any>>();

	public static add<K extends keyof PhenomBeholderMap>(
		type: K, listener: (ev: PhenomBeholderMap[K]) => any
	): void;
	public static add(type: stringliteral, listener: (ev: Phenomenon) => any): void;
	public static add(type: string, listener: (phenom: Phenomenon) => any): void {
		const set = Beholder.#beholders.get(type) ?? (() => {
			const set = new Set<(phenom: Phenomenon<any>) => any>();
			Beholder.#beholders.set(type, set);

			return set;
		})();

		set.add(listener);
	}

	public static remove<K extends keyof PhenomBeholderMap>(
		type: K, listener: (ev: PhenomBeholderMap[K]) => any
	): void;
	public static remove(type: stringliteral, listener: (ev: Phenomenon) => any): void;
	public static remove(type: string, listener: (ev: Phenomenon) => any): void {
		Beholder.#beholders.get(type)?.delete(listener);
	}

	public static dispatch(phenom: Phenomenon) {
		Beholder.#beholders.get(phenom.type)?.forEach(beholder => beholder(phenom));
	}

}


export const addBeholder = Beholder.add;
export const removeBeholder = Beholder.remove;
export const dispatchPhenom = Beholder.dispatch;
