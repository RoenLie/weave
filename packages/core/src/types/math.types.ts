type _IncDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
type IncDigit = _IncDigit[number];
type _Inc<T extends string> = T extends `${ infer F }${ IncDigit }`
	? T extends `${ F }${ infer L extends IncDigit }`
		? `${ L extends 9 ? _Inc<F> : F }${ _IncDigit[L] }`
		: never
	: 1


/** Increments the numeric type by one. */
export type Increment<T extends number> = number extends T
	? number
	: `${ T }` extends `${ string }${ '.' | '+' | '-' | 'e' }${ string }`
		? number
		: _Inc<`${ T }`> extends `${ infer N extends number }`
			? N
			: never
