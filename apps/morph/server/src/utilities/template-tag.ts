const parseTag = async (strings: TemplateStringsArray, ...values: unknown[]) => {
	let aggregator = '';

	for (let i = 0; i < strings.length; i++) {
		const string = strings[i];
		aggregator += string;

		const expr = values[i];
		if (expr === undefined || expr === false)
			continue;

		let value: unknown = expr;

		if (typeof value === 'function')
			value = value();

		if (value instanceof Promise)
			value = await value;

		if (Array.isArray(value))
			value = (await Promise.all(value)).join('');

		aggregator += value;
	}

	return aggregator;
};

export const html = parseTag;
export const css = parseTag;
