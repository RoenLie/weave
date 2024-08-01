import type { RecursiveRecord } from '@roenlie/core/types';

import { crossProductOfPaths } from './expand-paths.ts';
import type { TreeNode } from './tree.ts';
import { Tree } from './tree.ts';


export interface LayerData { node: RecursiveRecord; key: string }


/**
 * Returns an array of all expanded paths generated from the layers.
 */
export const locationsToList = (layerData: LayerData[]) => {
	if (layerData.some(x => !x.node))
		throw new TypeError('One of the supplied objects is undefined');

	const lineages: string[][] = [];
	for (const { key, node } of layerData) {
		const tree = new Tree<string, string>(node => node.data);
		createFromRawObj(tree, node);

		const lineage: string[] = [];

		let current = tree.getNode(key);
		while (current) {
			lineage.unshift(current.data);
			current = current.parent;
		}

		lineages.push(lineage.length ? lineage : [ key ]);
	}

	return crossProductOfPaths(lineages);
};


const createFromRawObj = (
	tree: Tree<string, string>,
	obj: RecursiveRecord,
	parentNode: TreeNode<string> | undefined = undefined,
) => {
	Object.entries(obj).forEach(([ key, value ]) => {
		const node = tree.add({
			parent:   parentNode,
			children: [],
			data:     key,
		});

		createFromRawObj(tree, value, node);
	});
};
