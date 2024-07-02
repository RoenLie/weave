import { cloneAt, PathArg, readPath, Rec, writePath } from '@eyeshare/shared';
import { AttributePart, noChange } from 'lit';
import { AsyncDirective, directive, DirectiveParameters, PartInfo, PartType } from 'lit/async-directive.js';


type Options = {
	event: string;
	convert?: {
		in?: (value?: any) => any;
		out?: (value?: any) => any;
	}
}


class TwoWayBindDirective extends AsyncDirective {

	private _hostEl: HTMLElement;
	private _targetEl: HTMLElement;
	private _path: PathArg<Rec, any>;
	private _options: Options;
	private _prop: string;

	constructor(part: PartInfo) {
		super(part);
		if (part.type !== PartType.PROPERTY)
			throw new Error('`twoWayBind()` can only be used inside a property declaration.');
	}

	private _handleChange = (ev: Event) => {
		const source = ev.target;
		let value: any = readPath<any, any, any>(source, [ this._prop ]);

		if (this._options.convert?.out)
			value = this._options.convert.out(value);


		writePath<any, any, any>(this._hostEl, this._path, value);
		cloneAt<any, any>(this._hostEl, this._path, 'start');
	};

	public override update(part: AttributePart, params: DirectiveParameters<this>) {
		super.update(part, params);

		const [ host, path, options ] = params;

		this._targetEl = part.element;
		this._prop = part.name;
		this._hostEl = host;
		this._path = path;
		this._options = {
			event:   options?.event ?? 'change',
			convert: options?.convert,
		};

		let value = readPath<any, any, any>(this._hostEl, this._path);

		if (this._options.convert?.in)
			value = this._options.convert.in(value);


		writePath<any, any, any>(this._targetEl, [ this._prop ], value);
		this._addListener();

		return noChange;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public render(host: HTMLElement, path: string[], options?: Partial<Options>) {
		return noChange;
	}

	protected override disconnected() {
		super.disconnected();
		this._removeListener();
	}

	protected override reconnected() {
		super.reconnected();
		this._addListener();
	}

	private _addListener = () => {
		this._removeListener();
		this._targetEl.addEventListener(this._options.event, this._handleChange);
	};

	private _removeListener = () => {
		this._targetEl.removeEventListener(this._options.event, this._handleChange);
	};

}

/**
 */
export const twoWayBind = directive(TwoWayBindDirective) as
	<TPath extends string>(host: HTMLElement, path: TPath[], options?: Partial<Options>) => any;

/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { TwoWayBindDirective };
