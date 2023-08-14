const parseTag = (strings: TemplateStringsArray, ...values: unknown[]) => {
	let aggregator = '';

	for (let i = 0; i < strings.length; i++) {
		const string = strings[i];
		aggregator += string;

		const expr = values[i];
		if (typeof expr === 'function')
			aggregator += expr();
		else if (expr !== undefined)
			aggregator += expr;
	}

	return aggregator;
};

export const html = parseTag;
export const css = parseTag;
