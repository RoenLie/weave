import * as t from '@babel/types';

import { CreateCompiledPart } from './attribute-processor.ts';


export class TemplateBuilder {

	protected currentQuasi: string[] = [];
	protected quasis:       t.TemplateElement[] = [];
	protected expressions:  (t.Expression | t.TSType)[] = [];

	protected commitQuasi(): void {
		this.quasis.push(t.templateElement({ raw: this.currentQuasi.join(''), cooked: '' }));
		this.currentQuasi.length = 0;
	}

	addText(text: string): void {
		this.currentQuasi.push(text);
	}

	addExpression(expression: t.Expression): void {
		this.commitQuasi();
		this.expressions.push(expression);
	}

	createTaggedTemplate(identifier: string): t.TaggedTemplateExpression {
		if (this.currentQuasi.length)
			this.commitQuasi();

		const ttl = t.taggedTemplateExpression(
			t.identifier(identifier),
			t.templateLiteral(this.quasis, this.expressions),
		);

		this.quasis = [];
		this.expressions = [];

		return ttl;
	}

}


export class CompiledBuilder {

	protected templateText: string = '';
	protected parts:        t.ObjectExpression[] = [];
	protected values:       t.Expression[] = [];

	addText(text: string): void {
		this.templateText += text;
	}

	addPart(part: t.ObjectExpression): void {
		this.parts.push(part);
	}

	addValue(value: t.Expression): void {
		this.values.push(value);
	}

	addChild(index: number, value: t.Expression): void {
		this.addPart(CreateCompiledPart.child(index));
		this.addValue(value);
	}

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
