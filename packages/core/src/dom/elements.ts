/**
 * Find the closest node which is a `ShadowRoot` or `Document` by traversing the `parentNode` ancestry.
 */
export const findDocumentOrShadowRoot = (node: Node): DocumentOrShadowRoot => {
	while (!(node instanceof ShadowRoot || node instanceof Document))
		node = node!.parentNode!;

	return node as DocumentOrShadowRoot;
};

/**
 * Is the `ancestor` actually an ancestor of the `node`? (Pierces shadow boundaries to find out.)
 */
export const elementHasAncestor = (node: Node, ancestor: Node): boolean => {
	let n: null | Node = node;

	while (n) {
		if (n === ancestor)
			return true;

		if (n instanceof ShadowRoot)
			n = n.host as Node;
		else if (n instanceof Element && n.assignedSlot)
			n = n.assignedSlot.parentNode! as Node;
		else
			n = n.parentNode as null | Node;
	}

	return false;
};

/**
 * Is the `descendant` actually a descendant of the `node`? (Pierces shadow boundaries to find out.)
 */
export const elementHasDescendant = (node: Node, descendant: Node): boolean => {
	return elementHasAncestor(descendant, node);
};

/**
 * Find the activeElement within the `node` or `document` and recursively pierce shadow boundaries.
 *
 * @param node The node to search within. (default: document)
 * @param includeSelf Check if the node itself is the activeElement? (default: false)
 *
 * @returns The innermost activeElement within the `node` when it exists, otherwise `null`.
 */
export const findActiveElement = (node: Node = document, includeSelf = false): HTMLElement | null => {
	const findActiveElementInner = (node: Node): HTMLElement | null => {
		const element: HTMLElement = node as HTMLElement;
		if (element.shadowRoot)
			return findActiveElementInner(element.shadowRoot);

		if (node instanceof ShadowRoot || node instanceof Document) {
			return node.activeElement
				? findActiveElementInner(node.activeElement) ?? node.activeElement as HTMLElement
				: node.activeElement;
		}

		return null;
	};

	// Attempt to find the active element inside of the node.
	const activeElement = findActiveElementInner(node);
	if (activeElement)
		return activeElement;

	// Check if the node itself is the activeElement within its nearest shadow boundary.
	if (includeSelf && !(node instanceof ShadowRoot || node instanceof Document)) {
		const container = findDocumentOrShadowRoot(node);
		if (container.activeElement && container.activeElement === node)
			return container.activeElement as HTMLElement;
	}

	return null;
};
