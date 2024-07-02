/**
 * Performs a breadth-first traversal of the DOM, starting from the specified root element.
 *
 * @param rootNode The root node to start the traversal from
 * @param callback A callback function to be invoked for each visited node.
 * an end function is supplied as the second parameter. Calling this will discontinue any future iterations.
 */
export const breadthTraverseDOM = (
	rootNode: Element,
	callback: (node: (Element | ShadowRoot), end: () => void, endBranch: () => void) => void,
): void => {
	// Create a queue to hold the nodes that we need to visit.
	const queue: (Element | ShadowRoot)[] = [];

	// Controlls wether or not the traversal should continue.
	let traverse = { value: true };
	const end = () => { traverse.value = false; };

	// Add the root node to the queue.
	queue.push(rootNode);

	// While there are nodes in the queue...
	while (queue.length > 0 && traverse.value) {
		// Remove the next node from the queue.
		const node = queue.shift()!;

		// Enables ending further traversal of this branch.
		let endBranch = false;
		const endBranchFn = () => endBranch = true;

		// Invoke the callback function with the node.
		callback(node, end, endBranchFn);

		// End traversal of this node if the supplied function was called.
		if (endBranch)
			continue;

		// If the node has a shadow root, add it to the queue.
		if (node instanceof Element) {
			if (node.shadowRoot)
				queue.push(node.shadowRoot);
		}

		// Think slot nodes should not be traversed, as we already go through children.
		//// If the node is a slot, add its assigned elements to the queue.
		//if (node instanceof HTMLSlotElement)
		//	queue.push(...node.assignedElements());


		// Add the node's children to the queue.
		if (node.children)
			queue.push(...node.children);
	}
};


/**
 * Performs a depth-first traversal of the DOM, starting from the specified root node.
 *
 * @param rootNode The root node to start the traversal from
 * @param callback A callback function to be invoked for each visited node
 */
export const depthTraverseDOM = (
	rootNode: Element | ShadowRoot,
	callback: (node: Element | ShadowRoot, end: () => void, endBranch: () => void) => void,
): void => {
	const traversal = (
		rootNode: Element | ShadowRoot,
		callback: (node: Element | ShadowRoot, end: () => void, endBranch: () => void) => void,
		traverse = { value: true },
	): void => {
		if (!traverse.value)
			return;

		// Controlls wether or not the traversal should continue.
		const end = () => { traverse.value = false; };

		// Enables ending further traversal of this branch.
		let endBranch = false;
		const endBranchFn = () => endBranch = true;

		// Invoke the callback function with the root node.
		callback(rootNode, end, endBranchFn);

		// End traversal of this node if the supplied function was called.
		if (endBranch)
			return;

		// If the root node has a shadow root, traverse it.
		if (rootNode instanceof Element) {
			if (rootNode.shadowRoot)
				traversal(rootNode.shadowRoot, callback, traverse);
		}

		// Think slot nodes should not be traversed, as we already go through children.
		//// If the root node has a slot, traverse its assigned nodes.
		//if (rootNode instanceof HTMLSlotElement) {
		//	if (rootNode.assignedElements)
		//		rootNode.assignedElements().forEach(node => traversal(node, callback, traverse));
		//}

		// Traverse the root node's children.
		if (rootNode.children)
			[ ...rootNode.children ].forEach(node => traversal(node, callback, traverse));
	};

	traversal(rootNode, callback);
};
