export class DataModel {

	protected constructor(values: any) {
		for (const [ key, value ] of Object.entries(values))
			(this as any)[key] = value;
	}

	public static parse?(values: unknown): unknown;
	public static initialize?(values: unknown): unknown;

}
