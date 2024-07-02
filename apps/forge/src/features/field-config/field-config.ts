declare global {
	interface FieldMap {
		input: InputConfig;
		select: SelectConfig;
	}

	type FieldKey = {[K in keyof FieldMap]: K}[keyof FieldMap];
	type FieldType = FieldMap[keyof FieldMap];
}

export interface BaseConfig {
	label: string;
	value: any;
}

export interface InputConfig extends BaseConfig {
	type: 'input';
}

export interface SelectConfig extends BaseConfig {
	type: 'select';
	options: {
		key: string;
		value: string;
		description: string;
	}[];
}


type OmitType<T> = Omit<T, 'type'>;


export class CreateFields {

	protected static config: FieldType[] = [];

	protected static get fields() {
		return {
			input:  this.input,
			select: this.select,
			build:  () => this.config,
		};
	}

	public static input = (args: OmitType<InputConfig>) => {
		const cfg = args as InputConfig;
		cfg.type = 'input';

		this.config.push(cfg);

		return this.fields;
	};

	public static select = (args: OmitType<SelectConfig>) => {
		const cfg = args as SelectConfig;
		cfg.type = 'select';

		this.config.push(cfg);

		return this.fields;
	};

	public static isInput(field: FieldType): field is InputConfig {
		return field.type === 'input';
	}

	public static isSelect(field: FieldType): field is SelectConfig {
		return field.type === 'select';
	}

}
