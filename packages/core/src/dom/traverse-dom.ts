export type DOMPrimitive  = Element | ShadowRoot | Document | Window | Node;


/**
 * Gathering of type guards for DOM nodes.
 */
export const isNodeOf = {
	/** Checks if the node is a window. */
	window:   (node: DOMPrimitive): node is Window => node instanceof Window,
	/** Checks if the node is a document. */
	document: (node: DOMPrimitive): node is Document => {
		if ('nodeType' in node)
			return node.nodeType === Node.DOCUMENT_NODE;

		return false;
	},
	/** Checks if the node is an element. */
	element: (node: DOMPrimitive): node is Element => {
		if ('nodeType' in node)
			return node.nodeType === Node.ELEMENT_NODE;

		return false;
	},
	/** Checks if the node is an htmlelement. */
	htmlElement: (node: DOMPrimitive): node is HTMLElement => {
		if ('nodeType' in node)
			return node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement;

		return false;
	},
	/** Checks if the node is a shadow root. */
	shadowRoot: (node: DOMPrimitive): node is ShadowRoot => {
		if ('host' in node)
			return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;

		return false;
	},
};


/**
 * Traverse the dom upwards from the `fromElement` to the root element.
 */
export const traverseDomUp = <T>(
	/** The element from which the traversal starts */
	fromElement: DOMPrimitive,
	/**
	 * The function to execute on each element.
	 * A stop function is passed as the second argument to stop the traversal.
	 */
	func: (node: DOMPrimitive, stop: (value?: T) => void) => void,
): T | undefined => {
	let stop = false;
	let stopValue: any = undefined;
	const stopFn = <T>(value?: T): value is T => {
		stop = true;
		stopValue = value;

		return true;
	};

	let currentElement: typeof fromElement | null = fromElement;

	do {
		func(currentElement, stopFn);
		if (stop)
			break;

		// the root element (HTML).
		if (isNodeOf.document(currentElement) || isNodeOf.window(currentElement))
			currentElement = null;
		// handle shadow root elements.
		else if (isNodeOf.shadowRoot(currentElement))
			currentElement = currentElement.host;
		// if the node is in a slot, we need to traverse up to the slot itself.
		else if (isNodeOf.element(currentElement) && currentElement.assignedSlot)
			currentElement = currentElement.assignedSlot;
		// handle if the node has a parent element.
		else if (currentElement.parentElement)
			currentElement = currentElement.parentElement;
		// Should be no other edge cases, so we can assume it's a regular element.
		else if (currentElement.parentNode)
			currentElement = currentElement.parentNode;
		else
			currentElement = null;
	} while (currentElement && !stop);

	return stopValue;
};


/**
 * Breadth-first dom traversal
 */
export const traverseDomDown = <T>(
	fromElement: DOMPrimitive,
	func: (element: DOMPrimitive, stop: (value?: T) => void) => void,
	includeSlots = true,
): T => {
	const visitedNodes = new WeakSet();

	let stop = false;
	let stopValue: any = undefined;
	const stopFn = (value?: T) => {
		stop = true;
		stopValue = value;
	};

	let currentNodes: DOMPrimitive[] = [ fromElement ];
	let nextNodes: DOMPrimitive[] = [];

	while (currentNodes.length && !stop) {
		for (const node of currentNodes) {
			if (visitedNodes.has(node))
				continue;

			visitedNodes.add(node);

			func(node, stopFn);
			if (stop)
				break;

			if (node instanceof Window) {
				nextNodes.push(node.document.documentElement);
			}
			else if (node instanceof Document) {
				nextNodes.push(node.documentElement);
			}
			else if (node instanceof ShadowRoot) {
				nextNodes.push(...node.children);
			}
			else if (node instanceof HTMLSlotElement) {
				nextNodes.push(...node.assignedElements());
			}
			else if (node instanceof Element) {
				if (node.shadowRoot) {
					if (includeSlots)
						nextNodes.push(...node.children);

					nextNodes.push(node.shadowRoot);
				}
				else {
					nextNodes.push(...node.children);
				}
			}
			else {
				nextNodes.push(...node.childNodes);
			}
		}

		// We clear current nodes so that we can reuse the array.
		// This is a memory optimization.
		currentNodes.length = 0;

		// Swap the arrays assignments, so that we can continue to traverse down.
		[ currentNodes, nextNodes ] = [ nextNodes, currentNodes ];
	}

	return stopValue;
};
