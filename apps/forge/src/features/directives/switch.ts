export const match = <T>(
	value: T,
	cases: [(value: T) => boolean, (value: T) => unknown][],
	defaultCase?: (value: T) => unknown,
) => {
	for (const [ predicate, result ] of cases) {
		if (predicate(value))
			return result(value);
	}

	return defaultCase?.(value);
};
