export interface DragOptions {
	/** Callback that runs as dragging occurs. */
	onMove:       (options: { x: number; y: number; event: PointerEvent; }) => void;
	/** Callback that runs when dragging stops. */
	onStop:       (options: { x: number; y: number; event: PointerEvent; }) => void;
	/**
	 * When an initial event is passed, the first drag will be triggered immediately using the coordinates therein. This
	 * is useful when the drag is initiated by a mousedown/touchstart event but you want the initial "click" to activate
	 * a drag (e.g. positioning a handle initially at the click target).
	 */
	initialEvent: PointerEvent;

	passive: boolean;
}


export const drag = (container: HTMLElement, options?: Partial<DragOptions>): {
	unsubscribe: () => void;
} => {
	const getXY = (ev: PointerEvent) => {
		const dims = container.getBoundingClientRect();
		const defaultView = container.ownerDocument.defaultView!;
		const offsetX = dims.left + defaultView.scrollX;
		const offsetY = dims.top + defaultView.scrollY;
		const x = ev.pageX - offsetX;
		const y = ev.pageY - offsetY;

		return { x, y };
	};

	const move = (ev: PointerEvent) => {
		if (options?.onMove) {
			const { x, y } = getXY(ev);
			options.onMove({ x, y, event: ev });
		}
	};

	const unsubscribe = () => {
		document.removeEventListener('pointermove', move);
		document.removeEventListener('pointerup', stop);
	};

	const stop = (ev: PointerEvent) => {
		unsubscribe();

		if (options?.onStop) {
			const { x, y } = getXY(ev);
			options.onStop({ x, y, event: ev });
		}
	};

	document.addEventListener('pointermove', move, { passive: options?.passive });
	document.addEventListener('pointerup', stop);

	// If an initial event is set, trigger the first drag immediately
	if (options?.initialEvent)
		move(options.initialEvent);

	return { unsubscribe };
};
