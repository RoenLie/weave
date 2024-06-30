export const sql = (strings: TemplateStringsArray, ...values: unknown[]): string =>
	String.raw({ raw: strings }, ...values);


export const escapeString = (str: string) => {
	return str.replaceAll("'", "''");
};
