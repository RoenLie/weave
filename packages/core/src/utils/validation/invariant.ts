const prefix = 'Invariant failed';


export const invariant = (condition: any, message?: string | (() => string)): asserts condition => {
	if (condition !== undefined && condition !== null)
		return condition;

	const provided = typeof message === 'function' ? message() : message;
	const value = provided ? prefix + ': ' + provided : prefix;
	throw new Error(value);
};
