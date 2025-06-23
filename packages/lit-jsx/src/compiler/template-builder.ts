import * as t from '@babel/types';


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
