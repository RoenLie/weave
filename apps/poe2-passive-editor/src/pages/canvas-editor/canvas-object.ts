export class Canvas2DObject extends Path2D {

	constructor() {
		super();
	}

	public fillStyle:   string = '';
	public strokeStyle: string = '';
	public lineWidth:   number = 0;

	public draw(ctx: OffscreenCanvasRenderingContext2D) {
		ctx.fillStyle = this.fillStyle;
		ctx.strokeStyle = this.strokeStyle;
		ctx.lineWidth = this.lineWidth;

		if (this.fillStyle)
			ctx.fill(this);
		if (this.strokeStyle)
			ctx.stroke(this);
	}

}
