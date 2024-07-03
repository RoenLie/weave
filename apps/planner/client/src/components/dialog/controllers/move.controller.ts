import { resolveValueProvider } from '@roenlie/core/function';
import { LitElement, ReactiveController, ReactiveControllerHost } from 'lit';

import { IConstraints } from './controller.types.js';


/** @internalexport */
export class MoveController<T extends LitElement> implements ReactiveController {

	private _host: T;
	private _moving = false;
	private _cursorOffset: [number, number] = [ 0, 0 ];
	private _thisDims: [number, number] = [ 0, 0 ];
	private _mutObserver: MutationObserver = new MutationObserver(() => this._handleMutation());

	private _handleMutation() {
		this._moveable()
			? this._host.classList.add('moveable')
			: this._host.classList.remove('moveable');
	}

	private _moveable() {
		return this._host.getAttribute('moveable') !== null;
	}

	constructor(
		host: ReactiveControllerHost,
		private constraints: () => IConstraints,
		private setXY: (v: readonly [string, string]) => void,
		private setTransformXY: (v: readonly [number, number]) => void,
	) {
		host.addController(this);
		this._host = host as T;
	}

	public hostConnected() {
		this._mutObserver.observe(this._host, {
			attributes: true, attributeFilter: [ 'moveable' ],
		});
		this._handleMutation();
	}

	public hostDisconnected() {
		this._mutObserver.disconnect();
	}

	public startMoveDialog = (e: MouseEvent) => {
		if (!this._moveable())
			return;

		this._moving = true;
		addEventListener('mousemove', this._moveDialog);
		addEventListener('mouseup', this._stopMoveDialog, { once: true });

		const rects = this._host.getBoundingClientRect();
		const rect = [ rects.left, rects.top ] as const;
		const curs = [ e.clientX, e.clientY ] as const;

		this._thisDims = [ rects.width, rects.height ];
		this._cursorOffset = [ curs[ 0 ] - rect[ 0 ], curs[ 1 ] - rect[ 1 ] ];
	};

	private _stopMoveDialog = () => {
		removeEventListener('mousemove', this._moveDialog);
		this._moving = false;

		const rects = this._host.getBoundingClientRect();
		this.setXY([ rects.x + 'px', rects.y + 'px' ]);
	};

	private _moveDialog = (e: MouseEvent) => {
		e.preventDefault();
		const buttons = e.buttons;
		const clientX = e.clientX;
		const clientY = e.clientY;

		if (buttons != 1)
			return this._stopMoveDialog();
		if (!this._moving)
			return;

		requestIdleCallback(() => {
			const { x: constX, y: constY } = this.constraints();

			const x = clientX - this._cursorOffset[ 0 ];
			const y = clientY - this._cursorOffset[ 1 ];
			const lowerLimitX = resolveValueProvider(constX[0]);
			const upperLimitX = resolveValueProvider(constX[1]);
			const lowerLimitY = resolveValueProvider(constY[0]);
			const upperLimitY = resolveValueProvider(constY[1]);

			const [ elWidth, elHeight ] = this._thisDims;

			const offset: [number, number] = [
				// get correct x position
				x + elWidth < upperLimitX && x > lowerLimitX ? x
					: x <= lowerLimitX ? lowerLimitX
						: upperLimitX - elWidth,
				// get correct y position
				y + elHeight < upperLimitY && y > lowerLimitY ? y
					: y <= lowerLimitY ? lowerLimitY
						: upperLimitY - elHeight,
			];

			this.setTransformXY([ offset[ 0 ], offset[ 1 ] ] as const);
		});
	};

}
