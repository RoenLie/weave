export const ifDefined = <T, TFn extends (value: T) => any>(
	value: T | undefined | null, fn: TFn,
): ReturnType<TFn> | undefined => {
	if (!value)
		return;

	return fn(value);
};
