import { convertToRgb } from '../mixins/color-mix.ts';


export class RGBA extends Array<number> {

	static fromString(color: string): RGBA {
		const rgba = convertToRgb(color);

		return rgba;
	}

	constructor(imageData: ImageData);
	constructor(...items: [r: number, g: number, b: number, a: number]);
	constructor(...items: [r: number, g: number, b: number, a: number] | [ImageData]) {
		if (items.length === 1 && items[0] instanceof ImageData) {
			const data = items[0].data;
			super(data[0]!, data[1]!, data[2]!, parseFloat((data[3]! / 255).toFixed(2)));

			return this;
		}

		super(...items as number[]);
	}

	toArray(): [number, number, number, number] {
		return [ this[0]!, this[1]!, this[2]!, this[3]! ];
	}

	/** Returns the rgba tuple as a css compliant rgba string. */
	override toString(): string {
		return `rgba(${ this[0] }, ${ this[1] }, ${ this[2] }, ${ this[3] })`;
	}

	/** Returns the rgba tuple as a css compliant hex string. */
	toHexaString(): string {
		console.log(this.toString());


		//  Set default values as if we supplied r, g, b as individual arguments
		const rgbaArr: [ number, number, number, number ] = [
			Math.min(Math.max(0, this[0]!), 255),
			Math.min(Math.max(0, this[1]!), 255),
			Math.min(Math.max(0, this[2]!), 255),
			Math.min(Math.max(0, this[3]!), 1),
		];

		let _r = rgbaArr[0].toString(16);
		let _g = rgbaArr[1].toString(16);
		let _b = rgbaArr[2].toString(16);
		let _a = Math.round(rgbaArr[3] * 255).toString(16);

		if (_r.length === 1)
			_r = '0' + _r;
		if (_g.length === 1)
			_g = '0' + _g;
		if (_b.length === 1)
			_b = '0' + _b;
		if (_a.length === 1)
			_a = '0' + _a;

		return '#' + _r + _g + _b + _a;
	}

	/** Returns the rgba tuple as a css compliant hex string. */
	toHexString(): string {
		return this.toHexaString().slice(0, -2);
	}

}
