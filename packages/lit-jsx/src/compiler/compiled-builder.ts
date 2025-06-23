import * as t from '@babel/types';

import { CreateCompiledPart } from './attribute-processor.ts';
import { EnsureImport } from './compiler-utils.ts';
import type { CompiledContext } from './transform-jsx2.ts';


export class CompiledBuilder {

	readonly importsUsed: Set<keyof typeof EnsureImport> = new Set();

	protected templateText: string = '';
	protected parts:        t.ObjectExpression[] = [];
	protected values:       t.Expression[] = [];

	addImport(name: keyof typeof EnsureImport): void {
		this.importsUsed.add(name);
	}

	addText(text: string): void {
		this.templateText += text;
	}

	addPart(part: t.ObjectExpression): void {
		this.parts.push(part);
	}

	addValue(value: t.Expression): void {
		this.values.push(value);
	}

	addAttribute(
		index: number,
		name: string,
		value: t.Expression,
		partType: 'attribute' | 'property' = 'attribute',
	): void {
		const part = partType === 'attribute'
			? CreateCompiledPart.attribute(index, name)
			: CreateCompiledPart.property(index, name);

		this.addPart(part);
		this.addValue(value);
	}

	addChild(index: number, value: t.Expression): void {
		this.addPart(CreateCompiledPart.child(index));
		this.addValue(value);
	}

	ensureImports(context: CompiledContext): void {
		type Imports = Omit<typeof EnsureImport, 'prototype'>;
		const record = EnsureImport as Imports;

		// Ensure all imports used in the JSX element are imported.
		this.importsUsed.forEach((importName) => {
			const key = importName as keyof Imports;
			if (key in record)
				record[key](context.program, context.path);
		});
	};

	createCompiledTemplate(): t.ObjectExpression {
		const taggedTemplate = t.taggedTemplateExpression(
			t.identifier('__$t'),
			t.templateLiteral([ t.templateElement({ raw: this.templateText }) ], []),
		);

		return t.objectExpression([
			t.objectProperty(t.stringLiteral('h'), taggedTemplate),
			t.objectProperty(t.stringLiteral('parts'), t.arrayExpression(this.parts)),
		]);
	}

	createExpression(variableName: string): t.ObjectExpression {
		return t.objectExpression([
			t.objectProperty(t.stringLiteral('_$litType$'), t.identifier(variableName)),
			t.objectProperty(t.stringLiteral('values'), t.arrayExpression(this.values)),
		]);
	}

}
