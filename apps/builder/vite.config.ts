import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import ts, { isCallExpression, isIdentifier } from 'typescript';
import { transform } from 'lightningcss';
import MagicString from 'magic-string';
import { hexToRgba } from './_builder/plugin/hex-to-rgba.ts';


export default defineConfig(() => {
	const builderRoot   = join(process.cwd(), '_builder');
	const builderAssets = join(process.cwd(), '_builder', 'assets');


	return {
		root:      builderRoot,
		publicDir: builderAssets,
		resolve:   {
			alias: [
				{
					find:        'root',
					replacement: join(process.cwd(), 'src'),

				},
			],
		},
		plugins: [
			((): Plugin => {
				return {
					name: 'builder',
					async configureServer(server) {
						server.hot.on('save', (data, client) => {
							console.log(data);
						});

						server.hot.on('select-component', (data: { tag: string; parentTag: string; }) => {
							const files = globSync(join(process.cwd(), 'src', '**/*.ts'));

							let styles: {
								backgroundColor: string;
							} | undefined = undefined;
							let path = '';

							for (const file of files) {
								const sourceFile = ts.createSourceFile(
									file,
									readFileSync(file, 'utf-8'),
									ts.ScriptTarget.ESNext,
									/*setParentNodes */ true,
								);

								styles = extractStyles(sourceFile, data.tag);
								if (styles) {
									path = file;
									break;
								}
							}

							if (!styles)
								return;

							server.hot.send('select-component', {
								tag:       data.tag,
								parentTag: data.parentTag,
								styles:    styles,
								path:      path,
							});
						});

						server.hot.on('patch-styles', (data: {
							tag:    string;
							path:   string;
							styles: { backgroundColor: string; }
						}) => {
							const fileContent = readFileSync(data.path, 'utf-8');
							const sourceFile = ts.createSourceFile(
								data.path,
								fileContent,
								ts.ScriptTarget.ESNext,
								/*setParentNodes */ true,
							);

							const classDeclaration = findCEClassDeclaration(sourceFile, data.tag);
							const stylesTemplate = findCEStylesTemplate(classDeclaration);
							if (!stylesTemplate)
								return;

							const text = stylesTemplate?.getText().slice(1, -1);

							const { code } = transform({
								filename: '',
								code:     Buffer.from(text),
								visitor:  {
									Rule(rule) {
										if (rule.type === 'style') {
											const firstSelector = rule.value.selectors[0]?.[0];
											if (firstSelector?.type === 'pseudo-class' && firstSelector.kind === 'host') {
												const decs = rule.value.declarations.declarations;

												for (const dec of decs) {
													if (dec.property === 'background-color') {
														dec.value = {
															type: 'rgb',
															...hexToRgba(
																data.styles.backgroundColor,
															),
														};
													}
												}
											}
										}

										return rule;
									},
								},
							});

							const parsedText = Buffer.from(code).toString()
								.split('\n')
								.map(line => '\t' + line)
								.join('\n');

							const s = new MagicString(fileContent);

							s.update(stylesTemplate.getStart() + 1,
								stylesTemplate.getEnd() - 1, '\n' + parsedText);

							writeFileSync(data.path, s.toString());
						});
					},
					handleHotUpdate(ctx) {
						if (!ctx.file.includes('/_builder/src')) {
							ctx.server.ws.send('frame-reload');

							return [];
						}
					},
				};
			})(),
		],
	};
});


const findCEClassDeclaration = (sourceFile: ts.SourceFile, tagname: string) => {
	let classDeclaration: ts.ClassDeclaration | undefined = undefined;

	(function findCustomElementClass(node: ts.Node) {
		switch (true) {
		case ts.isDecorator(node): {
			// Check if the parent is a class.
			if (!ts.isClassDeclaration(node.parent))
				break;

			// Check if the decorator is a call expression.
			const decoratorCall = node.expression;
			if (!isCallExpression(decoratorCall))
				break;

			// Check if the decorator calls expression is an identifier.
			const decoIdentifier = decoratorCall.expression;
			if (!isIdentifier(decoIdentifier))
				break;

			// Check if the decorator is named customElement
			if (decoIdentifier.escapedText !== 'customElement')
				break;

			const firstArgument = decoratorCall.arguments[0];
			const tag = firstArgument?.getText().slice(1, -1);
			//console.log(tag, tagname, tag === tagname);

			if (tag === tagname) {
				classDeclaration = node.parent;

				return;
			}

			break;
		}
		}

		ts.forEachChild(node, findCustomElementClass);
	})(sourceFile);

	return classDeclaration;
};

const findCEStylesTemplate = (classDec: ts.ClassDeclaration | undefined) => {
	if (!classDec)
		return;

	const stylesNode = ((classDeclaration: ts.ClassDeclaration) => {
		const styles = classDeclaration.members.find(node => {
			if (!ts.isPropertyDeclaration(node))
				return;
			if (node.name?.getText() !== 'styles')
				return;

			const isStatic = node.modifiers
				?.some(mod => mod.kind === ts.SyntaxKind.StaticKeyword);

			if (isStatic)
				return true;
		});

		if (!styles)
			return;

		if (ts.isPropertyDeclaration(styles))
			return styles;
	})(classDec);

	const initializer = stylesNode?.initializer;
	if (!initializer)
		return;

	if (!ts.isTaggedTemplateExpression(initializer))
		return;

	return initializer.template;
};


const extractStyles = (sourceFile: ts.SourceFile, tagname: string) => {
	const classDeclaration = findCEClassDeclaration(sourceFile, tagname);
	const stylesTemplate = findCEStylesTemplate(classDeclaration);
	if (!stylesTemplate)
		return;

	const text = stylesTemplate?.getText().slice(1, -1);

	let hostStyle: {
		backgroundColor: string;
	} = {
		backgroundColor: '',
	};

	transform({
		filename: '',
		code:     Buffer.from(text),
		visitor:  {
			Rule(rule) {
				if (rule.type === 'style') {
					const firstSelector = rule.value.selectors[0]?.[0];
					if (firstSelector?.type === 'pseudo-class' && firstSelector.kind === 'host') {
						const decs = rule.value.declarations.declarations;
						const backgroundColorDec = decs.find(dec => dec.property === 'background-color');
						const colorValue = backgroundColorDec?.value;

						let color = '';
						if (typeof colorValue === 'string')
							color = colorValue;
						else if (colorValue?.type === 'rgb')
							color = rgbaToHex(colorValue);

						hostStyle = {
							backgroundColor: color,
						};
					}
				}
			},
		},
	});

	return hostStyle;
};


const rgbaToHex = (rgba: {
	alpha: number;
	b:     number;
	g:     number;
	r:     number;
}) => {
	const { r, g, b, alpha } = rgba;

	const hexR = r.toString(16).padStart(2, '0');
	const hexG = g.toString(16).padStart(2, '0');
	const hexB = b.toString(16).padStart(2, '0');
	//const hexA = alpha.toString(16).padStart(2, '0');
	const hexA = '';

	return `#${ hexR }${ hexG }${ hexB }${ hexA }`;
};


const kebabize = (str: string) => str.replace(
	/[A-Z]+(?![a-z])|[A-Z]/g,
	(str, ofs) => (ofs ? '-' : '') + str.toLowerCase(),
);
