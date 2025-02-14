import type { Repeat } from '@roenlie/core/types';


export type Bezier = Repeat<4, Repeat<2, number>>;


/**
 * Adapted from bez3_to_cheb by Jacob Rus
 * https://observablehq.com/@jrus/bezier-segment-arclength
 */
const bez3_to_cheb = ([ b0, b1, b2, b3 ]: Bezier): Repeat<2, Repeat<4, number>> => {
	const denom = 1 / 32;
	const [ b00, b01 ] = b0;
	const [ b10, b11 ] = b1;
	const [ b20, b21 ] = b2;
	const [ b30, b31 ] = b3;

	return [
		[
			(10   * b00 + 6   * b10 + 6   * b20 + 10 * b30) * denom,
			(-15  * b00 - 3   * b10 + 3   * b20 + 15 * b30) * denom,
			(6    * b00 - 6   * b10 - 6   * b20 +  6 * b30) * denom,
			(-b00 + 3   * b10 - 3   * b20 + b30) * denom,
		], [
			(10   * b01 + 6   * b11 + 6 * b21 + 10 * b31) * denom,
			(-15  * b01 - 3   * b11 + 3 * b21 + 15 * b31) * denom,
			(6    * b01 - 6   * b11 - 6 * b21 +  6 * b31) * denom,
			(-b01 + 3   * b11 - 3 * b21 + b31) * denom,
		],
	];
};


/**
 * Adapted from evaluate by Jacob Rus
 * https://observablehq.com/@jrus/cheb#evaluate
 */
const chebeval = (coeffs: number[], x: number) => {
	const x2 = 2 * x;
	let d = coeffs.length - 1, b2 = 0, b1 = (d % 2) ? coeffs[d--]! : 0;
	for (let i = d; i >= 2; i -= 2) {
		b2 = coeffs[i]!   + x2 * b1 - b2;
		b1 = coeffs[i - 1]! + x2 * b2 - b1;
	}

	return coeffs[0]! + x * b1 - b2;
};


/**
 * Adapted from diff by Jacob Rus
 * https://observablehq.com/@jrus/cheb
 */
const diff = (coeffs: number[]): number[] => {
	const newcoeffs = [];
	let i = coeffs.length;

	newcoeffs[i--] = newcoeffs[i] = 0;
	while (i--)
		newcoeffs[i] = newcoeffs[i + 2]! + 2 * (i + 1) * coeffs[i + 1]!;

	newcoeffs[0]! *= .5;
	newcoeffs.splice(-2);

	return newcoeffs;
};


/**
 * Adapted from bez_offset by Jacob Rus
 * https://observablehq.com/@s-silva/bezier-curve-offsets
 */
const bez_offset = (bezier: Bezier, offset: number = 10) => {
	const curve_cheb = bez3_to_cheb(bezier);
	const [ x, y ] = curve_cheb;
	const Dx = diff(x);
	const Dy = diff(y);

	return (p: number): Repeat<2, number> => {
		const xp = chebeval(x, p), yp = chebeval(y, p);
		const Dxp = chebeval(Dx, p), Dyp = chebeval(Dy, p);

		// get the normal vector
		const N = { x: -Dyp, y: Dxp, len: Math.sqrt(Dxp * Dxp + Dyp * Dyp) };

		// unit normal vector
		const uN = { x: N.x / N.len, y: N.y / N.len };

		// offset vector
		const oN = { x: uN.x * offset, y: uN.y * offset };

		return [ xp + oN.x, yp + oN.y ];
	};
};

const vals2coeffs7 = (() =>  {
	const c0 = Math.sqrt(3);        // "twiddle" factor
	const d0 = 1 / 6, d1 = 1 / 12;  // output scaling factors

	return (points: Repeat<7, number>): Repeat<7, number> => {
		const [ x0, x1, x2, x3, x4, x5, x6 ] = points;
		const
			z0 = x6 + x0, z1 = x6 - x0, z2 = x5 + x1, z3 = c0 * (x5 - x1),
			z4 = x4 + x2, z5 = x4 - x2, z6 = 2 * x3,
			w0 = z0 + z6, w1 = z0 - z6, w2 = z2 + z4, w3 = z2 - z4, w4 = z1 + z5;

		return [
			d1 * (w0 + 2 * w2),
			d0 * (w4 + z3),
			d0 * (w1 + w3),
			d0 * (z1 - 2 * z5),
			d0 * (w0 - w2),
			d0 * (w4 - z3),
			d1 * (w1 - 2 * w3),
		];
	};
})();


/** Adapted from bezeval by Jacob Rus
 * https://observablehq.com/@jrus/bezplot
 */
const bezeval = (() => {
	const { abs } = Math;
	const onethird = 1 / 3;
	const chebpt7_1 = 1 / 2 - Math.sqrt(3) / 4;
	const chebpt7_5 = 1 / 2 + Math.sqrt(3) / 4;

	// Internal recursive helper function:
	const _bezeval = (
		boffset: (p: number) => [number, number],
		t0: number, t6: number,
		tolerance: number,
		x0: number, x3: number, x6: number,
		y0: number, y3: number, y6: number,
	): number[] => {
		const td = (t6 - t0);

		// Evaluate the function at the four new points for
		// this section, and find polynomial coefficients:
		const [ x1, y1 ] = boffset(t0 + td * chebpt7_1);
		const [ x2, y2 ] = boffset(t0 + td * 0.25);
		const [ x4, y4 ] = boffset(t0 + td * 0.75);
		const [ x5, y5 ] = boffset(t0 + td * chebpt7_5);

		const xcoeffs = vals2coeffs7([ x0, x1, x2, x3, x4, x5, x6 ]);
		const ycoeffs = vals2coeffs7([ y0, y1, y2, y3, y4, y5, y6 ]);
		let [ xc0, xc1, xc2, xc3, xc4, xc5, xc6 ] = xcoeffs as Repeat<7, number>;
		let [ yc0, yc1, yc2, yc3, yc4, yc5, yc6 ] = ycoeffs as Repeat<7, number>;

		// to compare against the tolerance
		const xresid = abs(xc4) + abs(xc5) + abs(xc6);
		const yresid = abs(yc4) + abs(yc5) + abs(yc6);

		// If we hit the desired tolerance, return a single bezier segment:
		if ((xresid < tolerance) && (yresid < tolerance)) {
			// Alias degree 6 polynomial to degree 3:
			xc0 += xc6, xc1 += xc5, xc2 += xc4;
			yc0 += yc6, yc1 += yc5, yc2 += yc4;

			// Convert from Chebyshev to Bernstein basis, and return:
			const xt0 = (3 * xc0 - 5 * xc2) * onethird, xt1 = (15 * xc3 - xc1) * onethird;
			const yt0 = (3 * yc0 - 5 * yc2) * onethird, yt1 = (15 * yc3 - yc1) * onethird;

			return [ x0, y0, xt0 + xt1, yt0 + yt1, xt0 - xt1, yt0 - yt1, x6, y6 ];
		}

		// If we don't hit the tolerance, recursively bisect the domain:
		const left = _bezeval(boffset, t0, 0.5 * (t0 + t6), tolerance, x0, x2, x3, y0, y2, y3);
		const right = _bezeval(boffset, 0.5 * (t0 + t6), t6, tolerance, x3, x4, x6, y3, y4, y6);

		// Combine Bezier path sections from the left and right halves:
		left.push(...right);

		return left;
	};

	return (bezier: Bezier, offset: number, tolerance: number) => {
		const boffset = bez_offset(bezier, offset);

		const [ t0, t6 ] = [ -1, 1 ];

		// Evaluate function at endpoints and midpoint:
		const [ x0, y0 ] = boffset(t0);
		const [ x3, y3 ] = boffset(0.5 * (t0 + t6));
		const [ x6, y6 ] = boffset(t6);

		return _bezeval(boffset, t0, t6, tolerance, x0, x3, x6, y0, y3, y6);
	};
})();


/**
 * Adapted from bezpts_to_svgpath by Jacob Rus
 * https://observablehq.com/@jrus/bezplot
 */
const bezptsToCanvasPath = (pts: number[]) => {
	const output: (Repeat<2, number> | Repeat<6, number>)[] = [];

	const n = pts.length;
	let x = 1 / 0, y = 1 / 0;

	for (let i = 0; i < n; i += 8) {
		// If the endpoints of two adjacent segments are not close
		// together, "move to" the startpoint of the next segment.
		if (Math.abs(pts[i]! - x) + Math.abs(pts[i + 1]! - y) > 1e-12)
			output[0] = [ pts[i]!, pts[i + 1]! ];

		output.push([
			pts[i + 2]!,
			pts[i + 3]!,
			pts[i + 4]!,
			pts[i + 5]!,
			pts[i + 6]!,
			pts[i + 7]!,
		]);

		x = pts[i + 6]!, y = pts[i + 7]!;
	}

	return output;
};


export const drawParallelBezierCurve = (
	path: CanvasPath,
	bezier: Bezier,
	offset: number = 10,
) => {
	const bezierPoints = bezeval(bezier, offset, 0.1);
	const canvasPath = bezptsToCanvasPath(bezierPoints);

	for (const bezier of canvasPath) {
		if (bezier.length === 2)
			path.moveTo(bezier[0], bezier[1]);
		else
			path.bezierCurveTo(...bezier);
	}
};
