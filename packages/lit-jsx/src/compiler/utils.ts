import type { BabelFile, Node, NodePath } from '@babel/core';
import type { Hub } from '@babel/traverse';
import type { JSXElement } from '@babel/types';

import type { DefaultConfig } from './config.ts';

export const isComponent = (tagName: string): boolean => {
	return (tagName[0] && tagName[0].toLowerCase() !== tagName[0])
		|| tagName.includes('.')
		|| /[^a-zA-Z]/.test(tagName[0]!);
};


export type CustomNodePath<T = Node> = NodePath<T> & {
	hub: Hub & {
		file: BabelFile & {
			metadata: {
				config: DefaultConfig;
			};
		};
	};
};

export type JSXElementPath = CustomNodePath<JSXElement>;
export type JSXFragmentPath = CustomNodePath<JSXElement>;
export type JSXNodePath = JSXElementPath | JSXFragmentPath;


export const getConfig = (path: NodePath): DefaultConfig => {
	return (path as any as CustomNodePath).hub.file.metadata.config;
};
