import {
	html as coreHtml,
	svg as coreSvg,
	type TemplateResult,
} from 'lit/html.js';


const specialFunc = (strings: string[], ...values: unknown[]) => {
	return JSON.stringify({ strings: JSON.stringify(strings), values: JSON.stringify(values) });
};


export const withJSX = (
	coreTag: typeof coreHtml | typeof coreSvg,
) => (templateStrings: TemplateStringsArray, ...values: unknown[]): TemplateResult => {
	const strings = [ ...templateStrings ]
		.map(str => str.replaceAll(/[\t\n]+/g, ''));

	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < strings.length; i++) {
		const string = strings[i]!;

		// eslint-disable-next-line @typescript-eslint/prefer-for-of
		for (let j = 0; j < string.length; j++) {
			const char = string[j]!;
			const nextChar = string[j + 1] ?? '';

			// If this is true, we hit a JSX tag.
			// This means we should iterate from here, until we find the end of the tag.
			// If the end of the tag is not in this string, what to do?
			//		we continue searching for the end of the tag in the next string.
			//		once we find the end, we mark the index for the end compared to the input strings.
			//		We then know which value indexes belong inside our function??
			// We can then set the i and j index, break out of this inner loop
			// and therefor continue the search from where we ended the tag.
			if (/<[A-Z]/.test(char + nextChar)) {
				const result = findEndOfTag(strings, i, j);
				if (result) {
					const newStartString = string.slice(
						result.charStartIndex,
						result.stringStartIndex === result.stringEndIndex
							? result.charEndIndex : string.length,
					);

					let newEndString = '';
					newEndString += '';

					if (result.stringStartIndex === result.stringEndIndex) {
						strings[result.stringStartIndex] = string.slice(0, result.charStartIndex);
						strings.splice(result.stringStartIndex += 1, 0, string.slice(result.charEndIndex));
					}
					else {
						newEndString = strings[result.stringEndIndex]!
							.slice(0, result.charEndIndex);

						strings[result.stringStartIndex] = string
							.slice(0, result.charStartIndex);

						strings[result.stringEndIndex] = strings[result.stringEndIndex]!
							.slice(result.charEndIndex);

						strings.splice(result.stringStartIndex, 0, '');
					}

					const indexes: number[] = [];
					for (let i = result.stringStartIndex; i < result.stringEndIndex; i++)
						indexes.unshift(i);

					const stringIndexesToSplice = indexes;
					const valueIndexesToSplice = indexes;

					const packedStrings = [
						newStartString, ...stringIndexesToSplice
							.flatMap(index => strings.splice(index, 1))
							.reverse(),
					];
					newEndString && packedStrings.push(newEndString);

					const packedValues = valueIndexesToSplice
						.flatMap(index => values.splice(index, 1))
						.reverse();

					values.splice(result.stringStartIndex, 0, specialFunc(packedStrings, ...packedValues));
				}
			}
		}
	}

	// This is required for Lit accepting it as a template strings array.
	(strings as any).raw = strings;

	return coreTag(
		strings as unknown as TemplateStringsArray,
		...values,
	);
};


const findEndOfTag = (
	strings: TemplateStringsArray | string[],
	stringStart: number,
	charStart: number,
): {
	stringStartIndex: number;
	stringEndIndex: number;
	charStartIndex: number;
	charEndIndex: number;
} | undefined => {
	let tag = '';
	const tagString = strings[stringStart]!;
	for (let i = charStart + 1; i < tagString.length; i++) {
		const char = tagString[i]!;
		if (/[ \t\n>]/.test(char))
			break;

		tag += char;
	}

	const endTagExpr = new RegExp('</' + tag + '>');

	for (let i = stringStart; i < strings.length; i++) {
		const string = strings[i]!;

		for (let j = i === stringStart ? charStart : 0; j < string.length; j++) {
			const char = string[j]!;
			const nextChar = string[j + 1] ?? '';

			let testSegment = '';
			for (let i = j; i < j + tag.length + 3; i++)
				testSegment += (string[i] ?? '');

			// If we hit this, it means we can search for the end of the tag.
			if (endTagExpr.test(testSegment)) {
				for (let k = j; k < string.length; k++) {
					if (/>/.test(string[k]!)) {
						return {
							stringStartIndex: stringStart,
							stringEndIndex:   i,
							charStartIndex:   charStart,
							charEndIndex:     k + 1,
						};
					}
				}
			}
			else if (/\/>/.test(char + nextChar)) {
				return {
					stringStartIndex: stringStart,
					stringEndIndex:   i,
					charStartIndex:   charStart,
					charEndIndex:     j + 1,
				};
			}
		}
	}

	return undefined;
};

export const dirHtml = withJSX(coreHtml);


export function DirComponent(create: () => () => TemplateResult) {
	//

	return () => dirHtml`
	<div>
		Hello
	</div>
	`;
}


const Hello = DirComponent(() => {
	return () => dirHtml`
	<span>
		Hello
	</span>
	`;
});
const World = DirComponent(() => {
	return () => dirHtml`
	<span>
		Hello
	</span>
	`;
});
const combined = DirComponent(() => {
	return () => dirHtml`
	<div>
		<Hello />
		<World />

		<Hello>

		</Hello>
	</div>
	`;
});
