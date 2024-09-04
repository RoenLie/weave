import { LitElement, type ReactiveController } from 'lit';


/** Sums together all numbers in the array. */
const sum = (numbers: number[]) => numbers.reduce((acc, n) => acc + n, 0);


export class GridFrResizeController implements ReactiveController {

	constructor(
		protected options: {
			host:                LitElement;
			setInitialFractions: () => number[];
			getColumnIndex:      (ev: MouseEvent) => number;
			getViewportWidth:    () => number;
			onAfterResizeEnds?:  () => void;
		},
	) {
		(this.options.host).addController(this);
		this._fractions = options.setInitialFractions();
	}

	public get fractions() { return this._fractions; }

	protected _fractions: number[] = [];

	public hostConnected(): void { }
	public hostDisconnected(): void { }

	public resize = (() => {
		let initialFrs = [] as number[];
		let initialX   = NaN;
		let panelIndex = NaN;
		let viewportWidth = NaN;

		const lowerLimit = 0.2;
		let totalFr      = NaN;
		let growingFr    = NaN;
		let shrinkingFr  = NaN;

		let deltaXlowerLimit = NaN;
		let deltaXupperLimit = NaN;

		const mousedown = (ev: MouseEvent) => {
			ev.preventDefault();

			initialFrs    = [ ...this._fractions ];
			initialX      = ev.clientX;
			panelIndex    = this.options.getColumnIndex(ev);
			viewportWidth = this.options.getViewportWidth();

			totalFr     = sum(initialFrs);
			growingFr   = initialFrs[panelIndex]!;
			shrinkingFr = initialFrs[panelIndex + 1]!;

			deltaXlowerLimit = -Infinity;
			deltaXupperLimit = Infinity;

			window.addEventListener('mousemove', mousemove);
			window.addEventListener('mouseup', mouseup);
		};

		const mousemove = (() => {
			let ev: MouseEvent;
			const impl = () => {
				const deltaX = Math.max(deltaXlowerLimit,
					Math.min(ev.clientX - initialX, deltaXupperLimit));

				const deltaFr = deltaX / viewportWidth * totalFr;
				const newFr = growingFr + deltaFr;

				const newFrs = [ ...initialFrs ];
				newFrs[panelIndex] = Math.round(newFr * 1000) / 1000;
				newFrs[panelIndex + 1] = Math.round((shrinkingFr - deltaFr) * 1000) / 1000;

				// If either column is at or below the lower limit,
				// we need to take the overflow and remove it from the opposing column.
				// This way we can keep the total fraction count column x 1.
				if (newFrs[panelIndex]! <= lowerLimit)
					deltaXlowerLimit = deltaX;
				else if (newFrs[panelIndex + 1]! <= lowerLimit)
					deltaXupperLimit = deltaX;

				this._fractions.length = 0;
				for (const fr of newFrs)
					this._fractions.push(fr);

				this.options.host.requestUpdate();
			};

			return (event: MouseEvent) => {
				ev = event;
				requestAnimationFrame(impl);
			};
		})();

		const mouseup = () => {
			window.removeEventListener('mousemove', mousemove);
			window.removeEventListener('mouseup', mouseup);

			this.options.onAfterResizeEnds?.();
		};

		return mousedown;
	})();

}
