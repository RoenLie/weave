import type { PluginPass } from '@babel/core';
import type { NodePath, Scope, VisitNode } from '@babel/traverse';
import type { JSXElement, JSXFragment } from '@babel/types';
import * as t from '@babel/types';

import { getConfig } from './utils.ts';


export const transformJSX: VisitNode<
	PluginPass, JSXElement | JSXFragment
> = (path): void => {
	const config = getConfig(path);
	const replace = transformThis(path);
	//const result = transformNode(
	//	path,
	//	t.isJSXFragment(path.node)
	//		? {}
	//		: {
	//			topLevel:    true,
	//			lastElement: true,
	//		},
	//);

	//const template = getCreateTemplate(config, path, result);

	//path.replaceWith(replace(template(path, result, false)));
};


const getTargetFunctionParent = (path: NodePath, parent: Scope | null) => {
	let current = path.scope.getFunctionParent();
	while (current && current !== parent && current.path.isArrowFunctionExpression())
		current = current.path.parentPath.scope.getFunctionParent();

	return current;
};


export const transformThis = (path: NodePath<JSXElement | JSXFragment>) => {
	const parent = path.scope.getFunctionParent();
	let thisId: t.Identifier;
	path.traverse({
		ThisExpression(path) {
			const current = getTargetFunctionParent(path, parent);
			if (current === parent) {
				thisId || (thisId = path.scope.generateUidIdentifier('self$'));
				path.replaceWith(thisId);
			}
		},
		JSXElement(path) {
			let source = path.get('openingElement').get('name');
			while (source.isJSXMemberExpression())
				source = source.get('object');

			if (source.isJSXIdentifier() && source.node.name === 'this') {
				const current = getTargetFunctionParent(path, parent);
				if (current === parent) {
					thisId || (thisId = path.scope.generateUidIdentifier('self$'));
					source.replaceWith(t.jsxIdentifier(thisId.name));

					if (path.node.closingElement)
						path.node.closingElement.name = path.node.openingElement.name;
				}
			}
		},
	});

	return (node: t.Expression): t.Expression | t.CallExpression => {
		if (!thisId)
			return node;

		if (!parent || parent.block.type === 'ClassMethod') {
			const decl = t.variableDeclaration(
				'const',
				[ t.variableDeclarator(thisId, t.thisExpression()) ],
			);

			if (parent) {
				const stmt = path.getStatementParent();
				stmt && stmt.insertBefore(decl);
			}
			else {
				return t.callExpression(
					t.arrowFunctionExpression(
						[],
						t.blockStatement([ decl, t.returnStatement(node) ]),
					),
					[],
				);
			}
		}
		else {
			parent.push({
				id:   thisId,
				init: t.thisExpression(),
				kind: 'const',
			});
		}

		return node;
	};
};
