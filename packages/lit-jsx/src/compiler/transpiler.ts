import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

import {
	CompiledAttributeProcessor,
	CreateCompiledPart,
	type ProcessorContext,
	TemplateAttributeProcessor,
} from './attribute-processor.ts';
import { CompiledBuilder, TemplateBuilder } from './builder.ts';
import {
	ensureImports,
	getProgramFromPath,
	getTemplateType,
	isJSXElementPath,
	isJSXElementStatic,
	isJSXFragmentPath,
	isValidOpeningElement,
} from './compiler-utils.ts';
import {
	Ensure,
	getJSXElementName,
	isJSXCustomElementComponent,
	isJSXFunctionElementComponent,
	isValidJSXElement,
} from './compiler-utils.ts';
import {
	COMPONENT_LITERAL_PREFIX,
	ERROR_MESSAGES,
	VARIABLES,
	WHITESPACE_TAGS,
} from './config.ts';


abstract class JSXTranspiler<TContext extends ProcessorContext> {

	protected abstract createContext(path: NodePath<t.JSXElement | t.JSXFragment>): TContext;

	start(path: NodePath<t.JSXElement | t.JSXFragment>): t.Expression {
		const context = this.createContext(path);

		this.process(context);

		const expression = this.createExpression(context);

		ensureImports(context);

		return expression;
	}

	abstract process(context: TContext): void;
	abstract openingTag(context: TContext): void;
	abstract attributes(context: TContext): void;
	abstract children(context: TContext): void;
	abstract closingTag(context: TContext): void;
	abstract createExpression(context: TContext): t.Expression;
	abstract createFunctionalComponent(path: NodePath<t.JSXElement | t.JSXFragment>): t.Expression;
	abstract functionalComponent(context: TContext): void;

}


export interface TemplateContext extends ProcessorContext {
	builder:     TemplateBuilder;
	literalName: string;
}

export class TemplateTranspiler extends JSXTranspiler<TemplateContext> {

	protected override createContext(path: NodePath<t.JSXElement | t.JSXFragment>): TemplateContext {
		const context: TemplateContext = {
			program:          getProgramFromPath(path),
			path,
			literalName:      '',
			tagName:          '',
			isInitialElement: true,
			builder:          new TemplateBuilder(),
			importsUsed:      new Set(),
		};

		return context;
	}

	override process(context: TemplateContext): void {
		if (t.isJSXFragment(context.path.node)) {
			context.builder.addText('');

			this.children(context);

			return;
		}

		context.tagName = getJSXElementName(context.path.node);

		if (isJSXCustomElementComponent(context.tagName)) {
			this.openingTag(context);
			this.attributes(context);
			this.children(context);
			this.closingTag(context);

			return;
		}

		if (isJSXFunctionElementComponent(context.tagName)) {
			// Process attributes and children into a props object
			if (!context.isInitialElement)
				this.functionalComponent(context);

			// If this is the initial element, this should not happen.
			// and it should instead have been processed as a single expression.

			return;
		}

		this.openingTag(context);
		this.attributes(context);
		this.children(context);
		this.closingTag(context);
	}

	override openingTag(context: TemplateContext): void {
		if (isJSXCustomElementComponent(context.tagName)) {
			const literalIdentifier = Ensure.componentLiteral(
				context.tagName,
				COMPONENT_LITERAL_PREFIX + context.tagName,
				context.path,
				context.program,
			);

			context.literalName = literalIdentifier.name;

			context.builder.addText('<');
			context.builder.addExpression(literalIdentifier);
		}
		else {
		// If the tag is not a component, we will treat it as a regular HTML element.
			context.builder.addText('<' + context.tagName);
		}
	}

	override attributes(context: TemplateContext): void {
		if (!isValidJSXElement(context.path))
			throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

		const { attributes } = context.path.node.openingElement;

		const processor = new TemplateAttributeProcessor();

		for (const attr of attributes.values())
			processor.processAttribute(attr, context);

		// Close the opening tag
		context.builder.addText('>');
	}

	override children(context: TemplateContext): void {
		for (const [ index, child ] of context.path.node.children.entries()) {
			if (t.isJSXText(child)) {
				if (WHITESPACE_TAGS.includes(context.tagName))
					context.builder.addText(child.value);
				else
					context.builder.addText(child.value.trim());
			}
			else if (t.isJSXExpressionContainer(child)) {
				if (t.isJSXEmptyExpression(child.expression))
					continue;

				context.builder.addExpression(child.expression);
			}
			else if (t.isJSXElement(child)) {
				const currentPath = context.path.get(`children.${ index }`);

				// Recursively process child elements
				if (isJSXElementPath(currentPath) || isJSXFragmentPath(currentPath)) {
					this.process({
						...context,
						path:             currentPath,
						isInitialElement: false,
					});
				}
			}
		}
	}

	override closingTag(context: TemplateContext): void {
		// If it's a component tag, we need to close it with the static literal.
		if (context.literalName) {
			context.builder.addText('</');
			context.builder.addExpression(t.identifier(context.literalName));
			context.builder.addText('>');
		}
		else {
			context.builder.addText('</' + context.tagName + '>');
		}
	}

	override createExpression(context: TemplateContext): t.Expression {
		const isStatic = isJSXElementStatic(context.path);
		const templateType = getTemplateType(context.path);

		let identifier: string = '';

		if (isStatic) {
			if (templateType === VARIABLES.HTML) {
				identifier = VARIABLES.HTML_STATIC;
				context.importsUsed.add('htmlStatic');
			}
			// This will not happen, as svg and mathml dynamic tags are not supported yet.
			else if (templateType === VARIABLES.SVG) {
				identifier = VARIABLES.SVG_STATIC;
				context.importsUsed.add('svgStatic');
			}
			// This will not happen, as svg and mathml dynamic tags are not supported yet.
			else if (templateType === VARIABLES.MATHML) {
				identifier = VARIABLES.MATHML_STATIC;
				context.importsUsed.add('mathmlStatic');
			}
			else {
				throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(templateType));
			}
		}
		else {
			if (templateType === VARIABLES.HTML) {
				identifier = VARIABLES.HTML;
				context.importsUsed.add('html');
			}
			else if (templateType === VARIABLES.SVG) {
				identifier = VARIABLES.SVG;
				context.importsUsed.add('svg');
			}
			else if (templateType === VARIABLES.MATHML) {
				identifier = VARIABLES.MATHML;
				context.importsUsed.add('mathml');
			}
			else {
				throw new Error(ERROR_MESSAGES.UNKNOWN_TEMPLATE_TYPE(templateType));
			}
		}

		return context.builder.createTaggedTemplate(identifier);
	}

	override createFunctionalComponent(path: NodePath<t.JSXElement | t.JSXFragment>): t.Expression {
		const context = this.createContext(path);

		if (!isValidJSXElement(context.path))
			throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

		const properties: (t.ObjectProperty | t.SpreadElement)[] = [];
		const attributes = context.path.node.openingElement.attributes;
		const tagName = getJSXElementName(context.path.node);

		for (const attr of attributes) {
			// Handle spread attributes by spreading the object
			if (t.isJSXSpreadAttribute(attr)) {
				properties.push(t.spreadElement(attr.argument));

				continue;
			}

			const name = attr.name.name.toString();
			const camelCaseName = name
				.replace(/-([a-zA-Z])/g, (_, letter) => letter.toUpperCase());

			let value: t.Expression;

			if (attr.value) {
				if (t.isJSXExpressionContainer(attr.value)) {
					// If the expression is empty, skip it
					if (t.isJSXEmptyExpression(attr.value.expression))
						continue;

					value = attr.value.expression;
				}
				else if (t.isStringLiteral(attr.value)) {
					value = attr.value;
				}
				// Other literal types
				else {
					value = attr.value as t.Expression;
				}
			}
			else {
				// Boolean attribute (no value means true)
				value = t.booleanLiteral(true);
			}

			properties.push(t.objectProperty(t.identifier(camelCaseName), value));
		}

		// Process children
		if (context.path.node.children.length > 0) {
			const childrenArray: t.Expression[] = [];

			const childrenPaths = context.path.get(`children`);
			for (const childPath of childrenPaths) {
				const child = childPath.node;

				if (t.isJSXText(child)) {
					const trimmedValue = child.value.trim();
					if (trimmedValue)
						childrenArray.push(t.stringLiteral(trimmedValue));
				}
				else if (t.isJSXExpressionContainer(child)) {
					if (t.isJSXEmptyExpression(child.expression))
						continue;

					childrenArray.push(child.expression);
				}
				else if (t.isJSXElement(child)) {
					if (!isValidOpeningElement(childPath))
						throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

					const isStatic = isJSXElementStatic(childPath);
					const templateType = getTemplateType(childPath);

					if (isStatic || templateType !== 'html') {
						// Create a new builder for this child element
						const childContext: TemplateContext = {
							...context,
							path:             childPath,
							builder:          new TemplateBuilder(),
							isInitialElement: false,
						};

						this.process(childContext);

						childrenArray.push(this.createExpression(childContext));
					}
					else {
						// For compiled version, we need to process child elements differently
						// Create a new compiled builder for this child element
						const childContext: CompiledContext = {
							...context,
							path:             childPath,
							builder:          new CompiledBuilder(),
							currentIndex:     0,
							isInitialElement: false,
						};

						const transpiler = new CompiledTranspiler();
						transpiler.process(childContext);

						// Add the child expression to the array
						childrenArray.push(transpiler.createExpression(childContext));
					}
				}
			}

			// Add children property if there are any children
			if (childrenArray.length > 0) {
				// If there's only one child, we can use it directly.
				// If there are multiple children, we wrap them in an array.
				// This is because JSX Component Functions expects
				// either a single child or an array of children.
				const childrenValue: t.Expression = childrenArray.length === 1
					? childrenArray[0]!
					: t.arrayExpression(childrenArray);

				properties.push(t.objectProperty(
					t.identifier('children'),
					childrenValue,
				));
			}
		}

		const expression = t.callExpression(
			t.identifier(tagName),
			[ t.objectExpression(properties) ],
		);

		return expression;
	}

	override functionalComponent(context: TemplateContext): void {
		const expression = this.createFunctionalComponent(context.path);

		context.builder.addText('');
		context.builder.addExpression(expression);
		context.builder.addText('');
	}

}


export interface CompiledContext extends ProcessorContext {
	builder:      CompiledBuilder;
	currentIndex: number;
}

export class CompiledTranspiler extends JSXTranspiler<CompiledContext> {

	protected override createContext(path: NodePath<t.JSXElement | t.JSXFragment>): CompiledContext {
		const context: CompiledContext = {
			program:          getProgramFromPath(path),
			path,
			currentIndex:     0,
			tagName:          '',
			isInitialElement: true,
			builder:          new CompiledBuilder(),
			importsUsed:      new Set([ 'taggedTemplateUtil' ]),
		};

		return context;
	}

	override process(context: CompiledContext): void {
		if (t.isJSXFragment(context.path.node)) {
			context.builder.addText('');

			this.children(context);

			return;
		}

		context.tagName = getJSXElementName(context.path.node);

		if (isJSXFunctionElementComponent(context.tagName)) {
			// Process attributes and children into a props object
			if (!context.isInitialElement)
				this.functionalComponent(context);

			// If this is the initial element, this should not happen.
			// and it should instead have been processed as a single expression.

			return;
		}

		this.openingTag(context);
		this.attributes(context);
		this.children(context);
		this.closingTag(context);
	}

	override openingTag(context: CompiledContext): void {
		context.builder.addText('<' + context.tagName);
	}

	override attributes(context: CompiledContext): void {
		if (!isValidJSXElement(context.path))
			throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

		const { attributes } = context.path.node.openingElement;
		const processor = new CompiledAttributeProcessor();

		// Process the attributes
		for (const attr of attributes.values())
			processor.processAttribute(attr, context);

		// Close the opening tag
		context.builder.addText('>');
	}

	override children(context: CompiledContext): void {
		for (const childPath of context.path.get('children').values()) {
			const child = childPath.node;

			// Index is incremented to ensure correct part indices.
			const partIndex = context.currentIndex + 1;

			if (t.isJSXText(child)) {
				if (WHITESPACE_TAGS.includes(context.tagName))
					context.builder.addText(child.value);
				else
					context.builder.addText(child.value.trim());
			}
			else if (t.isJSXExpressionContainer(child)) {
				if (t.isJSXEmptyExpression(child.expression))
					throw new Error(ERROR_MESSAGES.EMPTY_EXPRESSION);

				context.builder.addText('<?>');
				context.builder.addValue(child.expression);
				context.builder.addPart(CreateCompiledPart.child(partIndex));
			}
			else if (t.isJSXElement(child)) {
				if (!isValidJSXElement(childPath))
					throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

				// Recursively process child elements
				this.process({
					...context,
					path:             childPath,
					currentIndex:     partIndex,
					isInitialElement: false,
				});
			}
		}
	}

	override closingTag(context: CompiledContext): void {
		context.builder.addText('</' + context.tagName + '>');
	}

	override createExpression(context: CompiledContext): t.Expression {
		const variableName = context.path.scope.generateUid();
		const compiledTemplate = context.builder.createCompiledTemplate();
		const compiledExpression = context.builder.createExpression(variableName);

		Ensure.hoistAsTopLevelVariable(context.path, variableName, compiledTemplate);

		return compiledExpression;
	}

	override createFunctionalComponent(path: NodePath<t.JSXElement | t.JSXFragment>): t.Expression {
		const context = this.createContext(path);

		if (!isValidJSXElement(context.path))
			throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

		const properties: (t.ObjectProperty | t.SpreadElement)[] = [];
		const attributes = context.path.node.openingElement.attributes;
		const tagName = getJSXElementName(context.path.node);

		for (const attr of attributes) {
			// Handle spread attributes by spreading the object
			if (t.isJSXSpreadAttribute(attr)) {
				properties.push(t.spreadElement(attr.argument));

				continue;
			}

			const name = attr.name.name.toString();
			const camelCaseName = name
				.replace(/-([a-zA-Z])/g, (_, letter) => letter.toUpperCase());

			let value: t.Expression;

			if (attr.value) {
				if (t.isJSXExpressionContainer(attr.value)) {
					// If the expression is empty, skip it
					if (t.isJSXEmptyExpression(attr.value.expression))
						continue;

					value = attr.value.expression;
				}
				else if (t.isStringLiteral(attr.value)) {
					value = attr.value;
				}
				// Other literal types
				else {
					value = attr.value as t.Expression;
				}
			}
			else {
				// Boolean attribute (no value means true)
				value = t.booleanLiteral(true);
			}

			properties.push(t.objectProperty(t.identifier(camelCaseName), value));
		}

		// Process children
		if (context.path.node.children.length > 0) {
			const childrenArray: t.Expression[] = [];

			for (const childPath of context.path.get('children')) {
				const child = childPath.node;

				if (t.isJSXText(child)) {
					const trimmedValue = child.value.trim();
					if (trimmedValue)
						childrenArray.push(t.stringLiteral(trimmedValue));
				}
				else if (t.isJSXExpressionContainer(child)) {
					if (t.isJSXEmptyExpression(child.expression))
						continue;

					childrenArray.push(child.expression);
				}
				else if (t.isJSXElement(child)) {
					if (!isValidJSXElement(childPath))
						throw new Error(ERROR_MESSAGES.INVALID_OPENING_TAG);

					const isStatic = isJSXElementStatic(childPath);
					const templateType = getTemplateType(childPath);

					if (isStatic || templateType !== 'html') {
					// Create a new builder for this child element
						const childContext: TemplateContext = {
							...context,
							literalName:      '',
							path:             childPath,
							builder:          new TemplateBuilder(),
							isInitialElement: false,
						};

						const transpiler = new TemplateTranspiler();
						transpiler.process(childContext);

						childrenArray.push(transpiler.createExpression(childContext));
					}
					else {
						// For compiled version, we need to process child elements differently
						// Create a new compiled builder for this child element
						const childContext: CompiledContext = {
							...context,
							path:             childPath,
							builder:          new CompiledBuilder(),
							currentIndex:     context.currentIndex + 1,
							isInitialElement: false,
						};

						this.process(childContext);

						// Add the child expression to the array
						childrenArray.push(this.createExpression(childContext));
					}
				}
			}

			// Add children property if there are any children
			if (childrenArray.length > 0) {
				// If there's only one child, we can use it directly.
				// If there are multiple children, we wrap them in an array.
				// This is because JSX Component Functions expects
				// either a single child or an array of children.
				const childrenValue: t.Expression = childrenArray.length === 1
					? childrenArray[0]!
					: t.arrayExpression(childrenArray);

				properties.push(t.objectProperty(
					t.identifier('children'),
					childrenValue,
				));
			}
		}

		const expression = t.callExpression(
			t.identifier(tagName),
			[ t.objectExpression(properties) ],
		);

		return expression;
	}

	override functionalComponent(context: CompiledContext): void {
		const expression = this.createFunctionalComponent(context.path);

		context.builder.addText('<?>');
		context.builder.addValue(expression);
		context.builder.addPart(CreateCompiledPart.child(context.currentIndex + 1));
	}

}
