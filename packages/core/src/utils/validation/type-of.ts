class TypeOf {

	private _type: string;
	constructor(obj: any) {
		this._type = Object.prototype
			.toString.call(obj)
			.replace(/^\[object (.+)\]$/, '$1')
			.toLowerCase();
	}

	public string() {
		return this._type === 'string';
	}

	public number() {
		return this._type === 'number';
	}

	public array() {
		return this._type === 'array';
	}

	public object() {
		return this._type === 'object';
	}

	public symbol() {
		return this._type === 'symbol';
	}

}


/**
 * Wrapper for toString.call(var) to more easily and reliably get the correct
 * type from a variable.
 * @example
 * ```ts
 * 	if ( typeOf(variable).string() ) {
 * 		doSomething();
 * 	}
 * ```
 * .
 */
export const typeOf = function(obj: any) {
	return new TypeOf(obj);
};
