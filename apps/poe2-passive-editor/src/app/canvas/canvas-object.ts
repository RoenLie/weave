export class Canvas2DObject {

	public get empty() {
		return this.layers.length === 0;
	}

	public readonly layers: [
		path2D: Path2D,
		(ctx: OffscreenCanvasRenderingContext2D, path2D: Path2D) => void
	][] = [];

	public isPointInPath(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number) {
		return this.layers.some(([ path2D ]) => ctx.isPointInPath(path2D, x, y));
	}

	public layer(
		path: (path2D: Path2D) => void,
		paint: (ctx: OffscreenCanvasRenderingContext2D, path2D: Path2D) => void,
	) {
		const path2D = new Path2D();
		path(path2D);

		this.layers.push([ path2D, paint ]);

		return this;
	}

	public draw(ctx: OffscreenCanvasRenderingContext2D) {
		for (const [ path2D, paint ] of this.layers)
			paint(ctx, path2D);
	}

	public clear() {
		this.layers.length = 0;
	}

}


export class TimeTracker {

	private total = 0;
	private count = 0;

	public addMeasurement(time: number) {
		this.total += time;
		this.count++;
	}

	public getAverage(): number {
		return this.count ? this.total / this.count : 0;
	}

}
