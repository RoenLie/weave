import { domId } from '@roenlie/core/dom';
import type { Adapter } from './component.ts';


type Identifier = (string & Record<never, never>);
type Lifetime = 'singleton' | 'transient';
type Binding = 'class' | 'constant' | 'function';
type Value = unknown;

interface Registration {
	identifier: Identifier;
	value:      Value;
	cached?:    Value;
	type:       Binding;
	name?:      Identifier;
	tag?:       Identifier;
	lifetime:   Lifetime;
	segmentId?: string;
}


export class Resolver {

	constructor(protected module: Module) {}

	public get<T>(identifier: Identifier): T {
		const bindings = this.module.moduleRegistry.get(identifier);
		if (!bindings?.length)
			throw new Error('No binding found for identifier: ' + identifier);

		const binding = bindings[0]!;
		if (binding.type === 'constant')
			return binding.value as T;

		return undefined as T;
	}

}


export class Module {

	constructor(
		protected mapper: () => string = () => '',
	) {}

	public parent:     Module;
	public entrypoint: ModuleEntrypoint;

	public readonly segments: {
		scope:          string;
		segmentCached:  Segment | undefined;
		segmentPromise: () => Promise<Segment>;
	}[] = [];

	public readonly moduleRegistry = new Map<Identifier, Registration[]>();
	public readonly segmentRegistry = new Map<string, Registration[]>();

	public addSegment(segment: () => Promise<Segment>, scope = ''): this {
		this.segments.push({
			scope,
			segmentCached:  undefined,
			segmentPromise: segment,
		});

		return this;
	}

	public addEntrypoint(
		...entrypoint: ConstructorParameters<typeof ModuleEntrypoint>
	): this {
		this.entrypoint = new ModuleEntrypoint(...entrypoint);

		return this;
	}

	public async load() {
		this.moduleRegistry.clear();
		this.segmentRegistry.clear();

		const mappedScope = this.mapper();
		const segments = this.segments.filter(({ scope }) => scope === mappedScope);

		await Promise.all(segments.map(async segment => {
			if (!segment.segmentCached)
				segment.segmentCached = await segment.segmentPromise();

			segment.segmentCached.load(this);
		}));
	}

}


export class ModuleEntrypoint {

	constructor(
		/** Function that runs prior to rendering the routes render function. */
		public enter: (route: Resolver) => Promise<any> | any,

		/** Render function that returns the template to render for this route. */
		public render: (route: Resolver) => Promise<unknown> | unknown,
	) {}

}


export class Segment {

	constructor(protected registrator: (registrator: Registrator) => void) {}
	public readonly id: string = domId();

	public load(module: Module) {
		this.registrator(new Registrator(module, this));
	}

}


class Registrator {

	constructor(
		protected module: Module,
		protected segment: Segment,
	) {
		return {
			bind: this.bind.bind(this),
		} as Registrator;
	}

	protected binding = {
		identifier: '',
		value:      '',
		type:       'constant',
		name:       undefined,
		tag:        undefined,
		lifetime:   'singleton',
		segmentId:  this.segment.id,
	} as Registration;

	public bind(identifier: Identifier): RegisterBinding {
		const bindings = this.module.moduleRegistry.get(identifier) ??
			this.module.moduleRegistry.set(identifier, []).get(identifier)!;

		bindings.push(this.binding);

		this.module.segmentRegistry.set(this.segment.id, bindings);
		this.binding.identifier = identifier;

		return new RegisterBinding(this.module, this.segment, this.binding);
	};

}


class RegisterBinding {

	constructor(
		protected module: Module,
		protected segment: Segment,
		protected binding: Registration,
	) {}

	public to<T extends new () => any>(value: T): RegisterLifetime {
		this.binding.value = value;
		this.binding.type = 'class';

		return new RegisterLifetime(this.module, this.segment, this.binding);
	}

	public toFunction<T extends (...args: any) => any>(value: T): RegisterLifetime {
		this.binding.value = value;
		this.binding.type = 'function';

		return new RegisterLifetime(this.module, this.segment, this.binding);
	}

	public toConstant<T>(value: T): Segment {
		this.binding.value = value;
		this.binding.type = 'constant';

		return this.segment;
	}

	public toAdapter<T extends typeof Adapter>(value: T): Segment {
		this.binding.value = value;
		this.binding.type = 'constant';

		return this.segment;
	}

}


class RegisterLifetime {

	constructor(
		protected module: Module,
		protected segment: Segment,
		protected binding: Registration,
	) {}

	public named(name: Identifier): this {
		this.binding.name = name;

		return this;
	}

	public tagged(name: Identifier, tag: Identifier): this {
		this.binding.name = name;
		this.binding.tag = tag;

		return this;
	}

	public singleton(): Segment {
		this.binding.lifetime = 'singleton';

		return this.segment;
	}

	public transient(): Segment {
		this.binding.lifetime = 'transient';

		return this.segment;
	}

}
