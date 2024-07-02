export type BuiltInDrawables = [
	'table',
	'horizontalRule',
	'link',
	'image',
	'uploadedImage'
][number];


export const builtInDraws: [string, string][] = [
	[
		'table', `
		| Column 1 | Column 2 | Column 3 |
		| -------- | -------- | -------- |
		| Text     | Text     | Text     |
		`,
	],
	[
		'horizontalRule', `
		-----
		`,
	],
	[ 'link', `[' '](#url#)` ],
	[ 'image', `![' '](#url#)` ],
	[ 'uploadedImage', `![](#url#)` ],
];
