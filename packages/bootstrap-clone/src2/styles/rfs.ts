// Converting Twitter Bootstrap RFS mechanism into typescript to make it available for CSS in JS i.e. (styled components).
// Twitter Bootstrap RFS: https://github.com/twbs/rfs
// Javascript Approach: https://gist.github.com/supposedly/9b9f5de66c2bcbbf5d7469dcec50bfd7

// Usage
// import rfs from 'rfs';
// rfs( '20px', 'font-size' );
// rfs( '1.5rem', 'font-size' );
// rfs( '1rem', 'margin-bottom' );

// Styled Component
/*
const Dummy = styled.div`
  ${rfs('2rem', 'font-size')}
  ${rfs('1.5rem', 'padding')}
  background-color: red;
`
*/

// For RFS Configuration please check the Class Constructor. It is ideal to not modify the options in constructor directly but
// just check the properties that you would like to modify and pass them in the last line of this script in createRFS() first argument.
interface RFSConfig {
	rfsBaseValue?:                string;
	rfsUnit?:                     string;
	rfsBreakpoint?:               string;
	rfsBreakpointUnit?:           string;
	rfsTwoDimensional?:           boolean;
	rfsFactor?:                   number;
	rfsMode?:                     string;
	rfsClass?:                    boolean | string;
	rfsRemValue?:                 number;
	rfsSafariIframeResizeBugFix?: boolean;
	enableRfs?:                   boolean;
}

class RFS {

	constructor(private readonly args: RFSConfig = {
		rfsBaseValue:                '1.25rem',
		rfsUnit:                     'rem',
		rfsBreakpoint:               '1200px',
		rfsBreakpointUnit:           'px',
		rfsTwoDimensional:           false,
		rfsFactor:                   10,
		rfsMode:                     'min-media-query',
		rfsClass:                    false,
		rfsRemValue:                 16,
		rfsSafariIframeResizeBugFix: false,
		enableRfs:                   true,
	}) {
		// Initialize private properties based on args or provide default values
		this.rfsBaseValue      = this.unitless(this.args.rfsBaseValue ?? '1.25rem');
		this.rfsUnit           = this.args.rfsUnit ?? 'rem';
		this.rfsBreakpoint     = this.unitless(this.args.rfsBreakpoint ?? '1200px');
		this.rfsBreakpointUnit = this.args.rfsBreakpointUnit ?? 'px';
		this.rfsTwoDimensional = this.args.rfsTwoDimensional ?? false;
		this.rfsFactor         = this.args.rfsFactor ?? 10;
		this.rfsMode           = this.args.rfsMode ?? 'min-media-query';
		this.rfsClass          = this.args.rfsClass ?? false;
		this.rfsRemValue       = this.args.rfsRemValue ?? 16;
		this.enableRfs         = this.args.enableRfs ?? true;
		this.rfsBaseValueUnit  = this.unitOf(this.args.rfsBaseValue ?? '1.25rem');
		this.rfsBaseValue      = this.unitless(this.args.rfsBaseValue ?? '1.25rem');
		this.rfsSafariIframeResizeBugFix = this.args.rfsSafariIframeResizeBugFix ?? false;

		if (this.rfsBaseValueUnit === 'rem')
			this.rfsBaseValue *= this.rfsRemValue;

		this.rfsBreakpointUnitCache = this.unitOf(this.args.rfsBreakpoint ?? '1200px');
		this.rfsBreakpoint = this.unitless(this.args.rfsBreakpoint ?? '1200px');

		if (this.rfsBreakpointUnitCache === 'rem')
			this.rfsBreakpoint *= this.rfsRemValue;

		this.rfsMqValue = this.rfsBreakpointUnit === 'px'
			? `${ this.rfsBreakpoint }px`
			: `${ this.rfsBreakpoint / this.rfsRemValue }${ this.rfsBreakpointUnit }`;

		this.rfsMqPropertyWidth = this.rfsMode === 'max-media-query' ? 'max-width' : 'min-width';
		this.rfsMqPropertyHeight = this.rfsMode === 'max-media-query' ? 'max-height' : 'min-height';
	}

	// Declare properties with default values
	private readonly rfsBaseValue:                number;
	private readonly rfsUnit:                     string;
	private readonly rfsBreakpoint:               number;
	private readonly rfsBreakpointUnit:           string;
	private readonly rfsTwoDimensional:           boolean;
	private readonly rfsFactor:                   number;
	private readonly rfsMode:                     string;
	private readonly rfsClass:                    boolean | string;
	private readonly rfsRemValue:                 number;
	private readonly rfsSafariIframeResizeBugFix: boolean;
	private readonly enableRfs:                   boolean;
	private readonly rfsBaseValueUnit:            string;
	private readonly rfsBreakpointUnitCache:      string;
	private readonly rfsMqValue:                  string;
	private readonly rfsMqPropertyWidth:          string;
	private readonly rfsMqPropertyHeight:         string;

	typeOf(val: any): string {
		if (Array.isArray(val))
			return `array`;

		if (typeof val === `number`)
			return `number`;

		if (typeof val === `string`)
			return /^-?(\.\d+|\d+(\.\d+)?)[a-z]*$/.test(val) ? `number` : `string`;

		// btw: not necessary for this script, but needs to detect color names
		// to be an accurate translation of SASS's type-of()
		return typeof val;
	}

	unitOf(val: string): string {
		return /[a-z]+$/.exec(val)?.[0] ?? '';
	}

	unitless(val: string): number {
		const value = /(^-?(\.\d+|\d+(\.\d+)?))[a-z]*$/.exec(val);

		return value &&  2 <= value.length ? +value[1]! : 0;
	}

	abs(val: string | number): number {
		if (typeof val === `string`) {
			const matches = /^-?(\.\d+|\d+(\.\d+)?)[a-z]*$/.exec(val);

			return parseFloat(matches && 1 < matches.length ? `${ +matches[1]! }` : '0');
		}

		return Math.abs(+val);
	}

	dd(strings: TemplateStringsArray, ...keys: any[]): string {
		let str = strings;
		if (Array.isArray(str)) {
			str = Array.from(str).reduce((acc, cur, idx) =>
				acc ? `${ acc }${ keys[idx - 1] }${ cur }` : `${ cur }${ keys[idx - 1] }`);
		}

		const lines = str.toString().split(`\n`);
		const includeFirstLine = /\S/.test(lines[0]!);
		const includeLastLine = /\S/.test(lines[lines.length - 1]!);

		// `${includeFirstLine ? `^` : `\\n`}(\\s*)(?:.*?\\n(?:(?=\\n)|\\1)){${lines.length - 1 - !includeFirstLine - !includeLastLine}}`
		// 2 by default bc ignoring first line too
		const leastCommonIndent = new RegExp(
			  `\\n(\\s*)(?:.*?\\n(?:(?=\\n)|\\1)){${ lines.length - 2 - (includeLastLine ? 1 : 0) }}`,
		).exec(str.toString())![1]!.length;

		// return lines.slice(!includeFirstLine, includeLastLine ? undefined : -1)
		const ret = lines
			.slice(1, includeLastLine ? undefined : -1)
			.map((s) => s.slice(leastCommonIndent))
			.join(`\n`);

		return includeFirstLine ? `${ lines[0] }\n${ ret }` : ret;
	}

	// Internal mixin used to determine which media query needs to be used
	private _rfsMediaQuery(content: string): string {
		if (this.rfsTwoDimensional) {
			if (this.rfsMode === `max-media-query`) {
				return this.dd`
				@media (${ this.rfsMqPropertyWidth }: ${ this.rfsMqValue }), (${ this.rfsMqPropertyHeight }: ${ this.rfsMqValue }) {
					${ content }
				}
				`;
			}
			else {
				return this.dd`
				@media (${ this.rfsMqPropertyWidth }: ${ this.rfsMqValue }) and (${ this.rfsMqPropertyHeight }: ${ this.rfsMqValue }) {
					${ content }
				}
		 		`;
			}
		}
		else {
			return this.dd`
		 	@media (${ this.rfsMqPropertyWidth }: ${ this.rfsMqValue }) {
				${ content }
			}
			`;
		}
	}

	// Internal mixin that adds disable classes to the selector if needed.
	private _rfsRule(content: string): string {
		if (this.rfsClass === `disable` && this.rfsMode === `max-media-query`) {
			// Adding an extra class increases specificity, which prevents the media query to override the property
			return this.dd`
			&,
			.disable-rfs &,
			&.disable-rfs {
				${ content }
			}
			`;
		}
		else if (
			this.rfsClass === `enable` &&
			  this.rfsMode === `min-media-query`
		) {
			return this.dd`
			.enable-rfs &,
			&.enable-rfs {
				${ content }
			}
			`;
		}
		else {
			return content;
		}
	}

	// Internal mixin that adds enable classes to the selector if needed.
	private _rfsMediaQueryRule(content: string): string {
		const ret: string[] = [];

		if (this.rfsClass === `enable`) {
			if (this.rfsMode === `min-media-query`)
				ret.push(content);

			ret.push(this._rfsMediaQuery(this.dd`
			{
				.enable-rfs &,
				&.enable-rfs {
				${ content }
				}
			}
			`));
		}
		else {
			if (this.rfsClass === `disable` && this.rfsMode === `min-media-query`) {
				ret.push(this.dd`
				.disable-rfs &,
				&.disable-rfs {
				${ content }
				}
				`);
			}

			ret.push(this._rfsMediaQuery(content));
		}

		return ret.join(`\n`);
	}

	/** Helper function to get the formatted non-responsive value */
	private rfsValue(values: (string | number)[]): string {
		// Convert to list
		values = this.typeOf(values) !== `array` ? [ ...values ] : values;

		let val = ``;

		// Loop over each value and calculate value
		values.forEach((value) => {
			if (value === 0) {
				val = `${ val } 0`;
			}
			else {
				// Cache value unit
				const unit = this.typeOf(value) === `number` ? this.unitOf(value.toString()) : false;

				if (unit === `px`) {
					// Convert to `rem` if needed
					val = `${ val }  ${
							  this.rfsUnit === `rem`
									? `${ this.unitless(value.toString()) + this.rfsRemValue }rem`
									: value
						 }`;
				}
				else if (unit === `rem`) {
					// Convert to `px` if needed
					val = `${ val } ${
							  this.rfsUnit === `px`
									? `${ this.unitless(value.toString()) * this.rfsRemValue }px`
									: value
						 }`;
				}
				else {
					// If value isn't a number (like inherit) or value has a unit (not `px` or `rem`, like 1.5em) or $ is 0, just print the value
					val = `${ val } ${ value }`;
				}
			}
		});

		// Remove first space
		return val.slice(1);
	}

	/** Helper function to get the responsive value calculated by RFS */
	private rfsFluidValue(values: (string | number)[]): string {
		// Convert to list
		values = this.typeOf(values) !== `array` ? [ ...values ] : values;

		let val = ``;

		// Loop over each value and calculate value
		values.forEach((value) => {
			if (value === 0) {
				val = val + ` 0`;
			}
			else {
				// Cache value unit
				const unit = this.typeOf(value) === `number` ? this.unitOf(value.toString()) : false;

				// If value isn't a number (like inherit) or value has a unit (not `px` or `rem`, like 1.5em) or $ is 0, just print the value
				if (!unit || (unit !== `px` && unit !== `rem`)) {
					val = `${ val } ${ value }`;
				}
				else {
					// Remove unit from value for calculations
					value = this.unitless(value.toString());
					if (unit !== `px`)
						value *= this.rfsRemValue;


					// Only add the media query if the value is greater than the minimum value
					if (this.abs(value) <= this.rfsBaseValue || !this.enableRfs) {
						val = `${ val } ${
									this.rfsUnit === `rem`
										 ? `${ value / this.rfsRemValue }rem`
										 : `${ value }px`
							  }`;
					}
					else {
						// Calculate the minimum value
						const valueMin =
									this.rfsBaseValue +
									(this.abs(value) - this.rfsBaseValue) / this.rfsFactor;

						// Calculate difference between value and the minimum value
						const valueDiff = this.abs(value) - valueMin;

						// Base value formatting
						let minWidth =
									this.rfsUnit === `rem`
										? `${ valueMin / this.rfsRemValue }rem`
										: `${ valueMin }px`;
						// Use negative value if needed
						minWidth = value < 0 ? `-${ minWidth }` : minWidth;
						if (minWidth.startsWith(`--`))
							minWidth = minWidth.slice(2);


						// Use `vmin` if two-dimensional is enabled
						const variableUnit = this.rfsTwoDimensional ? `vmin` : `vw`;

						// Calculate the variable width between 0 and rfsBreakpoint
						const variableWidth = `${
									(valueDiff * 100) / this.rfsBreakpoint
							  }${ variableUnit }`;

						// Return the calculated value
						val = `${ val } calc(${ minWidth } ${
									value < 0 ? `-` : `+`
							  } ${ variableWidth })`;
					}
				}
			}
		});

		// Remove first space
		return val.slice(1);
	}

	/** RFS mixin */
	rfs(values: (string | number)[], property = `font-size`): string {
		if (!Array.isArray(values))
			values = [ values ];

		if (values && values.length) {
			const val = this.rfsValue(values);
			const fluidVal = this.rfsFluidValue(values);

			// Do not print the media query if responsive & non-responsive values are the same
			if (val === fluidVal) {
				return `${ property }: ${ val };`;
			}
			else {
				return this.dd`
		 ${ this._rfsRule(this.dd`
			${ property }: ${ this.rfsMode === `max-media-query` ? val : fluidVal };
			${ this.rfsSafariIframeResizeBugFix ? `min-width: (0 * 1vw);` : `` }
		 `) }
		 ${ this._rfsMediaQueryRule(this.dd`
			${ property }: ${ this.rfsMode === `max-media-query` ? fluidVal : val };
		 `) }
	  `;
			}
		}
		else {
			throw new Error(`No arguments given to RFS`);
		}
	}

}

// Define a type for your function
export function createRFS(args?: Partial<RFSConfig>): ((
	...values: (string | number)[]
) => string) {
	const rfsInstance: Record<string, any> = new RFS(args || {});

	// Define a type for your function
	// Use typeof to inherit properties from rfsInstance
	type RFSFunction = ((...values: (string | number)[]) => string) & typeof rfsInstance;

	const rfs: RFSFunction = (...values) => {
		if (values.length > 1) {
			const property = values.pop();

			return rfsInstance['rfs'](values, (property || 'font-size').toString());
		}

		return rfsInstance['rfs'](values);
	};

	Object.getOwnPropertyNames(Object.getPrototypeOf(rfsInstance)).filter(
		(prop: any) => typeof rfsInstance[prop] === `function` && !/^(?:_|rfs)/.test(prop),
	) .forEach((prop) => {
		const boundFunction = rfsInstance[prop].bind(rfsInstance);
		rfs[prop] = boundFunction;
		// if prop is kebab-caseable, add a kebab-cased variant
		if (prop.toLowerCase() !== prop) {
			// (If you want to use this elsewhere as a general kebab-caser, add (?!^) to the start of the regex)
			rfs[prop.replace(/(?=[A-Z])/g, `-`).toLowerCase()] = boundFunction;
		}
	});

	return rfs;
}


export const rfs = createRFS();
