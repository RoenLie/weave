export type DOMPrimitive  = Element | ShadowRoot | Document | Window | Node;


/**
 * Gathering of type guards for DOM nodes.
 */
export const isNodeOf = {
	/** Checks if the node is a window. */
	window:      (node: DOMPrimitive): node is Window     => node instanceof Window,
	/** Checks if the node is a document. */
	document:    (node: DOMPrimitive): node is Document   => node instanceof Document,
	/** Checks if the node is an element. */
	element:     (node: DOMPrimitive): node is Element    => node instanceof Element,
	/** Checks if the node is an htmlelement. */
	htmlElement: (node: DOMPrimitive): node is Element    => node instanceof HTMLElement,
	/** Checks if the node is a shadow root. */
	shadowRoot:  (node: DOMPrimitive): node is ShadowRoot => node instanceof ShadowRoot,
};


/**
 * Traverse the dom upwards from the `fromElement` to the root element.
 */
export const traverseDomUp = (
	/** The element from which the traversal starts */
	fromElement: DOMPrimitive,
	/**
	 * The function to execute on each element.
	 * A stop function is passed as the second argument to stop the traversal.
	 */
	func: (node: DOMPrimitive, stop: () => void) => void,
) => {
	let stop = false;
	const stopFn = () => stop = true;

	let currentElement: typeof fromElement | null = fromElement;

	do {
		func(currentElement, stopFn);
		if (stop)
			break;

		// the root element (HTML).
		if (currentElement instanceof Document || currentElement instanceof Window)
			currentElement = null;
		// handle shadow root elements.
		else if (currentElement instanceof ShadowRoot)
			currentElement = currentElement.host;
		// if the node is in a slot, we need to traverse up to the slot itself.
		else if (currentElement instanceof Element && currentElement.assignedSlot)
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
};


/**
 * Breadth-first dom traversal
 */
export const traverseDomDown = (
	fromElement: DOMPrimitive,
	func: (element: DOMPrimitive, stop: () => void) => void,
	includeSlots = true,
) => {
	const visitedNodes = new WeakSet();

	let stop = false;
	const stopFn = () => stop = true;

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
};
