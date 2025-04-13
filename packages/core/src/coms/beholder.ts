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

	static #beholders: Map<string, Set<(phenom: Phenomenon) => any>> = new Map();

	static add<K extends keyof PhenomBeholderMap>(
		type: K, listener: (ev: PhenomBeholderMap[K]) => any
	): void;
	static add(type: stringliteral, listener: (ev: Phenomenon) => any): void;
	static add(type: string, listener: (phenom: Phenomenon) => any): void {
		const set = Beholder.#beholders.get(type) ?? (() => {
			const set: Set<(phenom: Phenomenon<any>) => any> = new Set();
			Beholder.#beholders.set(type, set);

			return set;
		})();

		set.add(listener);
	}

	static remove<K extends keyof PhenomBeholderMap>(
		type: K, listener: (ev: PhenomBeholderMap[K]) => any
	): void;
	static remove(type: stringliteral, listener: (ev: Phenomenon) => any): void;
	static remove(type: string, listener: (ev: Phenomenon) => any): void {
		Beholder.#beholders.get(type)?.delete(listener);
	}

	static dispatch(phenom: Phenomenon) {
		Beholder.#beholders.get(phenom.type)?.forEach(beholder => beholder(phenom));
	}

}


export const addBeholder = Beholder.add;
export const removeBeholder = Beholder.remove;
export const dispatchPhenom = Beholder.dispatch;
