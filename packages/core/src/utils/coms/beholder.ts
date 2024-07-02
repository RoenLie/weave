/* eslint-disable @typescript-eslint/no-unused-vars */
import type { stringliteral } from '../../types/strings.types.js';


declare global {
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

	public static addBeholder<K extends keyof PhenomBeholderMap>(type: K, listener: (ev: PhenomBeholderMap[K]) => any): void;
	public static addBeholder(type: stringliteral, listener: (ev: Phenomenon) => any): void;
	public static addBeholder(type: string, listener: (phenom: Phenomenon) => any): void {
		let set = Beholder.#beholders.get(type) ?? (() => {
			const set = new Set<(phenom: Phenomenon<any>) => any>();
			Beholder.#beholders.set(type, set);

			return set;
		})();

		set.add(listener);
	}

	public static removeBeholder<K extends keyof PhenomBeholderMap>(type: K, listener: (ev: PhenomBeholderMap[K]) => any): void
	public static removeBeholder(type: stringliteral, listener: (ev: Phenomenon) => any): void;
	public static removeBeholder(type: string, listener: (ev: Phenomenon) => any): void {
		Beholder.#beholders.get(type)?.delete(listener);
	}

	public static dispatchPhenom(phenom: Phenomenon) {
		Beholder.#beholders.get(phenom.type)?.forEach(beholder => beholder(phenom));
	}

}


export const addBeholder = Beholder.addBeholder;
export const removeBeholder = Beholder.removeBeholder;
export const dispatchPhenom = Beholder.dispatchPhenom;
