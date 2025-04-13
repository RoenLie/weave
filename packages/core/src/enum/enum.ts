export type ToCamelCase<TString extends string> = Uncapitalize<CamelSpaces<CamelDashes<TString>>>;


export type CamelDashes<TString extends string> =
	TString extends `${ infer TPrefix }-${ infer TSuffix }`
		? `${ TPrefix }${ CamelDashes<Capitalize<TSuffix>> }`
		: TString;


export type CamelSpaces<TString extends string> =
	TString extends `${ infer TPrefix } ${ infer TSuffix }`
		? `${ TPrefix }${ CamelSpaces<Capitalize<TSuffix>> }`
		: TString;


export type InferEnum<T extends Record<string, string>> = T[keyof T];


export const Enum = <T extends string[]>(
	...keys: [...T]
): { [P in T[number] as ToCamelCase<P>]: P } => {
	const obj = {} as Record<keyof any, any>;
	for (const key of keys) {
		const modifiedKey = key.replaceAll(/-(\w)/g, (_, c: string) => c.toUpperCase());
		obj[modifiedKey] = key;
	}

	return obj as { [P in T[number] as ToCamelCase<P>]: P };
};
