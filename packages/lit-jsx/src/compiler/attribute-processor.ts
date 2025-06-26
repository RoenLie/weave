import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { PartType } from 'lit-html/directive.js';

import type { EnsureImport, Values } from './compiler-utils.ts';
import {
	ATTR_BIND_OBJ_NAME,
	ATTR_NAMES,
	ATTR_VALUES,
	ERROR_MESSAGES,
	VARIABLES,
} from './config.ts';
import type { CompiledContext, TemplateContext } from './transpiler.ts';


interface CallBindingAttribute extends t.JSXAttribute {
	value: t.JSXExpressionContainer & {
		expression: t.CallExpression & {
			callee: t.MemberExpression & {
				object:   t.Identifier;
				property: t.Identifier;
			};
			arguments: [ t.Expression ];
		};
	};
}

interface ArrowFunctionAttribute extends t.JSXAttribute {
	value: t.JSXExpressionContainer & {
		expression: t.ArrowFunctionExpression & {
			params: [ t.Identifier & { name: Values<typeof ATTR_VALUES>; } ];
			body:   t.Expression;
		};
	};
}

interface JSXAttributeWithExpression extends t.JSXAttribute {
	value: t.JSXExpressionContainer & {
		expression: t.Expression;
	};
}

interface JSXAttributeWithoutExpression extends t.JSXAttribute {
	value: Exclude<t.JSXAttribute['value'], t.JSXExpressionContainer>;
}

interface JSXAttributeBoolean extends t.JSXAttribute {
	value: null | undefined;
}

interface ValueBinding {
	type:       'prop' | 'bool';
	name:       string;
	expression: t.Expression;
}


export class AttributeValidators {

	static isCallBinding(attr: t.JSXAttribute): attr is CallBindingAttribute {
		if (!this.isExpression(attr))
			return false;

		const expression = attr.value.expression;

		if (!t.isCallExpression(expression))
			return false;

		const callee = expression.callee;
		if (!t.isMemberExpression(callee))
			return false;

		if (!t.isIdentifier(callee.object) || !t.isIdentifier(callee.property))
			return false;

		const objectNameMatches = callee.object.name === ATTR_BIND_OBJ_NAME;
		if (!objectNameMatches)
			return false;

		return true;
	}

	static isArrowBinding(attr: t.JSXAttribute): attr is ArrowFunctionAttribute {
		if (!this.isExpression(attr))
			return false;

		const expression = attr.value.expression;

		if (!t.isArrowFunctionExpression(expression))
			return false;

		// If the arrow function has no parameters, we can skip it.
		if (expression.params.length === 0)
			return false;

		// If the arrow function has more than one parameter, we can skip it.
		if (expression.params.length > 1)
			return false;

		// If the param is not an identifier, we can skip it.
		const param = expression.params[0];
		if (!t.isIdentifier(param))
			return false;

		// If the body of the arrow function is not an expression, we can skip it.
		if (!t.isExpression(expression.body))
			return false;

		// We check if it is a valid bind parameter.
		return param.name === ATTR_VALUES.PROP
		|| param.name === ATTR_VALUES.BOOL;
	}

	static isDirective(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === ATTR_NAMES.DIRECTIVE;
	}

	static isRef(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === ATTR_NAMES.REF;
	}

	static isClassListBinding(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === ATTR_NAMES.CLASS_LIST;
	}

	static isStyleListBinding(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return this.isExpression(attr) && attr.name.name.toString() === ATTR_NAMES.STYLE_LIST;
	}

	static isEvent(attr: t.JSXAttribute): attr is JSXAttributeWithExpression {
		return attr.name.name.toString().startsWith(ATTR_NAMES.EVENT_PREFIX);
	}

	static isExpression(attr: t.JSXAttribute): attr is JSXAttributeWithExpression  {
		return t.isJSXExpressionContainer(attr.value)
			&& t.isExpression(attr.value.expression);
	};

	static isNonExpression(attribute: t.JSXAttribute): attribute is JSXAttributeWithoutExpression {
		return !!attribute.value && !t.isJSXExpressionContainer(attribute.value);
	};

	static isSpread(attr: t.JSXAttribute | t.JSXSpreadAttribute): attr is t.JSXSpreadAttribute {
		return t.isJSXSpreadAttribute(attr);
	}

	static isBoolean(attr: t.JSXAttribute): attr is JSXAttributeBoolean {
		return !attr.value;
	}

}


export interface ProcessorContext {
	builder:          unknown;
	program:          t.Program;
	path:             NodePath<t.JSXElement | t.JSXFragment>;
	tagName:          string;
	isInitialElement: boolean;
	importsUsed:      Set<keyof Omit<typeof EnsureImport, 'prototype'>>;
}


abstract class AttributeProcessor<TContext extends ProcessorContext> {

	abstract callBinding(attr: CallBindingAttribute, context: TContext): void;
	abstract arrowBinding(attr: ArrowFunctionAttribute, context: TContext): void;
	abstract directive(attr: JSXAttributeWithExpression, context: TContext): void;
	abstract ref(attr: JSXAttributeWithExpression, context: TContext): void;
	abstract classList(attr: JSXAttributeWithExpression, context: TContext): void;
	abstract styleList(attr: JSXAttributeWithExpression, context: TContext): void;
	abstract event(attr: JSXAttributeWithExpression, context: TContext): void;
	abstract expression(attr: JSXAttributeWithExpression, context: TContext): void;
	abstract nonExpression(attr: JSXAttributeWithoutExpression, context: TContext): void;
	abstract spread(attr: t.JSXSpreadAttribute, context: TContext): void;
	abstract boolean(attr: JSXAttributeBoolean, context: TContext): void;

	processAttribute(attr: t.JSXAttribute | t.JSXSpreadAttribute, context: TContext): void {
		if (AttributeValidators.isSpread(attr))
			this.spread(attr, context);
		else if (AttributeValidators.isNonExpression(attr))
			this.nonExpression(attr, context);
		else if (AttributeValidators.isBoolean(attr))
			this.boolean(attr, context);

		// Expression attributes are checked based on their type.
		// Order is based on a guess as to which expression is more common.
		else if (AttributeValidators.isEvent(attr))
			this.event(attr, context);
		else if (AttributeValidators.isArrowBinding(attr))
			this.arrowBinding(attr, context);
		else if (AttributeValidators.isCallBinding(attr))
			this.callBinding(attr, context);
		else if (AttributeValidators.isClassListBinding(attr))
			this.classList(attr, context);
		else if (AttributeValidators.isStyleListBinding(attr))
			this.styleList(attr, context);
		else if (AttributeValidators.isRef(attr))
			this.ref(attr, context);
		else if (AttributeValidators.isDirective(attr))
			this.directive(attr, context);

		// Generic expression attributes are checked last
		// because this condition will be true for all expression attributes.
		// and we want the more specific cases to be checked first.
		else if (AttributeValidators.isExpression(attr))
			this.expression(attr, context);
		else
			throw new Error(ERROR_MESSAGES.UNKNOWN_JSX_ATTRIBUTE_TYPE);
	}

	protected createValueBinding(
		attr: CallBindingAttribute | ArrowFunctionAttribute,
		context: TContext,
	): ValueBinding {
		const expression = attr.value.expression;

		let isProp: boolean = false;
		let isBool: boolean = false;
		let expressionBody: t.Expression;

		if (t.isCallExpression(expression)) {
			isProp = expression.callee.property.name === ATTR_VALUES.PROP;
			isBool = expression.callee.property.name === ATTR_VALUES.BOOL;
			expressionBody = expression.arguments[0];
		}
		else if (t.isArrowFunctionExpression(expression)) {
			const param = expression.params[0];
			isProp = param.name === ATTR_VALUES.PROP;
			isBool = param.name === ATTR_VALUES.BOOL;
			expressionBody = expression.body;
		}
		else {
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_VALUE);
		}

		if (isProp) {
			return {
				type:       'prop',
				name:       attr.name.name.toString(),
				expression: expressionBody,
			};
		}
		else if (isBool) {
			return {
				type:       'bool',
				name:       attr.name.name.toString(),
				expression: expressionBody,
			};
		}
		else {
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_VALUE);
		}
	}

	protected createDirective(attr: JSXAttributeWithExpression, context: TContext): t.Expression[] {
		// Replace the spread attribute with its argument, minus the compiler func.
		const expression = attr.value.expression;

		// If the expression is a call, we can add it directly.
		if (t.isCallExpression(expression))
			return [ expression ];
		// If the expression is an array, we can add each item.
		else if (t.isArrayExpression(expression))
			return expression.elements.filter(item => t.isExpression(item));
		else
			throw new Error(ERROR_MESSAGES.INVALID_DIRECTIVE_VALUE);
	}

	protected createRef(attr: JSXAttributeWithExpression, context: TContext): t.CallExpression {
		context.importsUsed.add('createRef');

		// add a ref call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.REF),
			[ attr.value.expression ],
		);

		return expression;
	}

	protected createClassList(attr: JSXAttributeWithExpression, context: TContext): t.CallExpression {
		context.importsUsed.add('classMap');

		// add a classMap call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.CLASS_MAP),
			[ attr.value.expression ],
		);

		return expression;
	}

	protected createStyleList(attr: JSXAttributeWithExpression, context: TContext): t.CallExpression {
		context.importsUsed.add('styleMap');

		// add a styleMap call around the expression.
		const expression = t.callExpression(
			t.identifier(VARIABLES.STYLE_MAP),
			[ attr.value.expression ],
		);

		return expression;
	}

	protected createEvent(attr: JSXAttributeWithExpression, context: TContext): [ string, t.Expression ] {
		return [ attr.name.name.toString().slice(3), attr.value.expression ];
	}

	protected createExpression(attr: JSXAttributeWithExpression, context: TContext): [string, t.Expression] {
		return [ attr.name.name.toString(), attr.value.expression ];
	}

	protected createNonExpression(attr: JSXAttributeWithoutExpression, context: TContext): [string, string] {
		// If the value is a string, we can use it directly
		// Here we always bind the value as a string.
		// In the future, we might want to also support numbers.
		if (!t.isStringLiteral(attr.value))
			throw new Error(ERROR_MESSAGES.ONLY_STRING_LITERALS);

		return [ attr.name.name.toString(), attr.value.value ];
	}

	protected createSpread(attr: t.JSXSpreadAttribute, context: TContext): t.CallExpression {
		context.importsUsed.add('rest');

		// If it's a spread attribute, we wrap it in our custom `rest` directive.
		// This will allow us to handle the spread attribute correctly.
		// We also need to ensure that the `rest` directive is imported.
		return t.callExpression(
			t.identifier(VARIABLES.REST),
			[ attr.argument ],
		);
	}

	protected createBoolean(attr: JSXAttributeBoolean, context: TContext): string {
		// If the value is null or undefined, we can bind the attribute name directly.
		// This will result in a attribute without a value, e.g. `<div disabled>`.
		return attr.name.name.toString();
	}

}

export class TemplateAttributeProcessor extends AttributeProcessor<TemplateContext> {

	callBinding(attr: CallBindingAttribute, context: TemplateContext): void {
		this.valueBinding(attr, context);
	}

	arrowBinding(attr: ArrowFunctionAttribute, context: TemplateContext): void {
		this.valueBinding(attr, context);
	}

	directive(attr: JSXAttributeWithExpression, context: TemplateContext): void {
		for (const expression of this.createDirective(attr, context)) {
			context.builder.addText(' ');
			context.builder.addExpression(expression);
		}
	}

	ref(attr: JSXAttributeWithExpression, context: TemplateContext): void {
		const expression = this.createRef(attr, context);

		// add a space to keep correct spacing in the template.
		context.builder.addText(' ');
		context.builder.addExpression(expression);
	}

	classList(attr: JSXAttributeWithExpression, context: TemplateContext): void {
		const expression = this.createClassList(attr, context);

		context.builder.addText(' class=');
		context.builder.addExpression(expression);
	}

	styleList(attr: JSXAttributeWithExpression, context: TemplateContext): void {
		const expression = this.createStyleList(attr, context);

		context.builder.addText(' ' + 'style=');
		context.builder.addExpression(expression);
	}

	event(attr: JSXAttributeWithExpression, context: TemplateContext): void {
		const [ name, expression ] = this.createEvent(attr, context);

		context.builder.addText(' @' + name + '=');
		context.builder.addExpression(expression);
	}

	expression(attr: JSXAttributeWithExpression, context: TemplateContext): void {
		const [ name, expression ] = this.createExpression(attr, context);

		context.builder.addText(' ' + name + '=');
		context.builder.addExpression(expression);
	}

	nonExpression(attr: JSXAttributeWithoutExpression, context: TemplateContext): void {
		const [ name, value ] = this.createNonExpression(attr, context);

		context.builder.addText(' ' + name + '="' + value + '"');
	};

	spread(attribute: t.JSXSpreadAttribute, context: TemplateContext): void {
		const expression = this.createSpread(attribute, context);

		context.builder.addText(' ');
		context.builder.addExpression(expression);
	}

	boolean(attribute: JSXAttributeBoolean, context: TemplateContext): void {
		const name = this.createBoolean(attribute, context);

		context.builder.addText(' ' + name);
	};

	protected valueBinding(
		attr: CallBindingAttribute | ArrowFunctionAttribute,
		context: TemplateContext,
	): void {
		const { type, name, expression } = this.createValueBinding(attr, context);

		if (type === 'prop')
			context.builder.addText(' .');
		else if (type === 'bool')
			context.builder.addText(' ?');

		context.builder.addText(name + '=');
		context.builder.addExpression(expression);
	}

}

export class CompiledAttributeProcessor extends AttributeProcessor<CompiledContext> {

	callBinding(attr: CallBindingAttribute, context: CompiledContext): void {
		this.valueBinding(attr, context);
	}

	arrowBinding(attr: ArrowFunctionAttribute, context: CompiledContext): void {
		this.valueBinding(attr, context);
	}

	directive(attr: JSXAttributeWithExpression, context: CompiledContext): void {
		for (const expression of this.createDirective(attr, context)) {
			context.builder.addPart(CreateCompiledPart.element(context.currentIndex));
			context.builder.addValue(expression);
		}
	}

	ref(attr: JSXAttributeWithExpression, context: CompiledContext): void {
		const expression = this.createRef(attr, context);

		context.builder.addPart(CreateCompiledPart.element(context.currentIndex));
		context.builder.addValue(expression);
		context.importsUsed.add('createRef');
	}

	classList(attr: JSXAttributeWithExpression, context: CompiledContext): void {
		const expression = this.createClassList(attr, context);

		context.builder.addPart(CreateCompiledPart.attribute(context.currentIndex, 'class'));
		context.builder.addValue(expression);
		context.importsUsed.add('attributePart');
	}

	styleList(attr: JSXAttributeWithExpression, context: CompiledContext): void {
		const expression = this.createStyleList(attr, context);

		context.builder.addPart(CreateCompiledPart.attribute(context.currentIndex, 'style'));
		context.builder.addValue(expression);
		context.importsUsed.add('attributePart');
	}

	event(attr: JSXAttributeWithExpression, context: CompiledContext): void {
		const [ name, expression ] = this.createEvent(attr, context);

		context.builder.addPart(CreateCompiledPart.event(context.currentIndex, name));
		context.builder.addValue(expression);
		context.importsUsed.add('eventPart');
	}

	expression(attr: JSXAttributeWithExpression, context: CompiledContext): void {
		const [ name, expression ] = this.createExpression(attr, context);

		context.builder.addPart(CreateCompiledPart.attribute(context.currentIndex, name));
		context.builder.addValue(expression);
		context.importsUsed.add('attributePart');
	}

	nonExpression(attr: JSXAttributeWithoutExpression, context: CompiledContext): void {
		const [ name, value ] = this.createNonExpression(attr, context);

		context.builder.addText(' ' + name + '="' + value + '"');
	};

	spread(attr: t.JSXSpreadAttribute, context: CompiledContext): void {
		const expression = this.createSpread(attr, context);

		context.builder.addPart(CreateCompiledPart.element(context.currentIndex));
		context.builder.addValue(expression);
	}

	boolean(attr: JSXAttributeBoolean, context: CompiledContext): void {
		const name = this.createBoolean(attr, context);

		context.builder.addText(' ' + name);
	};

	protected valueBinding(
		attr: CallBindingAttribute | ArrowFunctionAttribute,
		context: CompiledContext,
	): void {
		const { type, name, expression } = this.createValueBinding(attr, context);

		if (type === 'prop') {
			context.builder.addPart(CreateCompiledPart.property(context.currentIndex, name));
			context.builder.addValue(expression);
			context.importsUsed.add('propertyPart');
		}
		else if (type === 'bool') {
			context.builder.addPart(CreateCompiledPart.boolean(context.currentIndex, name));
			context.builder.addValue(expression);
			context.importsUsed.add('booleanPart');
		}
	}

}


export class CreateCompiledPart {

	protected static createBasePart(type: PartType, index: number): t.ObjectProperty[] {
		return [
			t.objectProperty(t.stringLiteral('type'), t.numericLiteral(type)),
			t.objectProperty(t.stringLiteral('index'), t.numericLiteral(index)),
		];
	}

	protected static createAttributePart(
		index: number,
		name: string,
		ctor: string,
	): t.ObjectExpression {
		return t.objectExpression([
			...this.createBasePart(PartType.ATTRIBUTE, index),
			t.objectProperty(t.stringLiteral('name'), t.stringLiteral(name)),
			t.objectProperty(t.stringLiteral('strings'), t.arrayExpression([
				t.stringLiteral(''),
				t.stringLiteral(''),
			])),
			t.objectProperty(t.stringLiteral('ctor'), t.identifier(ctor)),
		]);
	}

	static child(index: number): t.ObjectExpression {
		return t.objectExpression(this.createBasePart(PartType.CHILD, index));
	};

	static element(index: number): t.ObjectExpression {
		return t.objectExpression(this.createBasePart(PartType.ELEMENT, index));
	};

	static attribute(index: number, name: string): t.ObjectExpression {
		return this.createAttributePart(index, name, VARIABLES.ATTRIBUTE_PART);
	};

	static property(index: number, name: string): t.ObjectExpression {
		return this.createAttributePart(index, name, VARIABLES.PROPERTY_PART);
	};

	static boolean(index: number, name: string): t.ObjectExpression {
		return this.createAttributePart(index, name, VARIABLES.BOOLEAN_PART);
	};

	static event(index: number, name: string): t.ObjectExpression {
		return this.createAttributePart(index, name, VARIABLES.EVENT_PART);
	};

}
