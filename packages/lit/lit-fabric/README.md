# Lit Fabric

[![npm](https://img.shields.io/npm/dt/@roenlie/lit-fabric)](https://npm.im/@roenlie/lit-fabric)
[![npm](https://img.shields.io/npm/v/@roenlie/lit-fabric)](https://npm.im/@roenlie/lit-fabric)

Fabric offers an alternative syntax for writing web-components through the [Lit component and templating system](https://lit.dev/).<br>
The syntax and method of component creation is similar to React Hooks. With some minor changes to make it useable with standard web components. While being as minimal of a wrapper as possible.

## Example
```typescript
component('demo-button', () => {
	const [ label, setLabel ] = useProperty('label', 'Click Me!', { type: String });
	const [ counter, setCounter ] = useState('counter', 0, { type: Number });
	const inputQry = useQuery('inputQry', 'input');
	let subCounter = 0;

	useConnected((element) => { });	
	
	useAfterConnected((element) => { });

	useWillUpdate((props, element) => { }, [ 'counter' ]);
	
	useUpdate((props, element) => { }, [ 'counter' ]);

	useUpdated((props, element) => { }, [ 'counter' ]);

	useDisconnected((element) => { });

	useController('testController', {
		hostUpdate() { },
		hostConnected() { },
		hostDisconnected() { },
	});

	useStyles(css`
		button {
			width: 200px;
			aspect-ratio: 1/2;
			border-radius: 12px;
		}
	`);

	return () => html`
	<button @click=${ () => setCounter(counter.value + 1) }>
		${ label?.value } ${ counter.value } ${ subCounter }
	</button>

	<input @input=${ (ev: InputEvent) =>
		setLabel((ev.target as HTMLInputElement).value) } />
	`;
}, {
	base: LitElement,
	mixins: []
}).register();
```

## Api
Fabric uses method overriding as its primary mechanism of creating a valid web-component.  
This allows for using all the Lit functionality without excessive amounts of indirection and redirection.

There are hooks available that cover basically all of lits standard component functionality.
If a feature is not yet supported, it trivial to create your own hook with the needed implementation.

### List of available hooks:

- [useProperty](#useproperty) 
- [useState](#usestate)
- [useQuery](#usequery)
- [useStyles](#useStyles)
- [useConnected](#useconnected)
- [useAfterConnected](#useafterconnected)
- [useDisconnected](#usedisconnected)
- [useWillUpdate](#usewillupdate)
- [useUpdate](#useupdate)
- [useUpdated](#useupdated)
- [useController](#usecontroller)

## useProperty
useProperty declares a reactive public property on the component.  
Equivalent to using the `@property()` decorator in standard Lit components.
Returns a tuple `[getter, setter]` that can be used to interact with the property.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseProperty<T> = (
	name: string,
	initialValue: T,
	options?: PropertyDeclaration<T>
) => readonly [ { value: T; }, (value: T) => void ];


component('demo-button', () => {
	const [ label, setLabel ] = useProperty('label', 'Click Me!');

	return () => html`
	<button>${ label?.value }</button>
	`;
}).register();
```

## useState
Exactly the same as a useProperty, except for it internally using the `@state`
functionality by forcefully setting the `state` option on the property to true.

This is intended for internal state, as opposed to the useProperty which is
intended for values that are set by the consumer of the component.
<br>[Back to list of hooks.](#list-of-available-hooks)

## useQuery
Replicates the behavior of the `@query()` decorator.<br>
Creates a getter that performs a querySelector call for the requested selector.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseQuery = <T extends Element = HTMLElement>(
	name: string,
	selector: string,
	cache?: boolean,
) => ({ value: T; });


component('demo-button', () => {
	const buttonQry = useQuery('buttonQry', 'button');

	return () => html`
	<button></button>
	`;
}).register();
```

## useStyles
Acts as the method of applying styles to a component.<br>
Internally appends the supplied styles to the components static `styles` property.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseStyles = (css: CSSResultGroup) => void;


component('demo-button', () => {
	useStyles(css`
		button {
			width: 200px;
			aspect-ratio: 1/2;
			border-radius: 12px;
		}
	`);

	return () => html`
	<button></button>
	`;
}).register();
```

## useConnected
Attaches logic to the LitElement `connectedCallback` method.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseConnected = (
	func: (element: LitElement) => void,
) => void;


component('demo-button', () => {
	useConnected((element) => {
		// Called when the element is connected to the DOM.
	});

	return () => html`
	<button></button>
	`;
}).register();
```

## useAfterConnected
Runs the registered function once per connection cycle of the component.
Function runs in the `updated` lifecycle method.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseAfterConnected = (
	func: (element: LitElement) => void,
) => void;


component('demo-button', () => {
	useAfterConnected((element) => {
		// Called on the first updated lifecycle method call
		// after each time the component is connected to the DOM.
	});

	return () => html`
	<button></button>
	`;
}).register();
```


## useDisconnected
Attaches logic to the LitElement `disconnectedCallback` method.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseDisconnected = (
	func: (element: LitElement) => void,
) => void;


component('demo-button', () => {
	useDisconnected((element) => {
		// Called when the element is disconnected from the DOM.
	});

	return () => html`
	<button></button>
	`;
}).register();
```


## useWillUpdate
Attaches logic to the LitElement `willUpdate` method.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseWillUpdate = (
	func: (changedProps: PropertyValues, element: LitElement) => void,
	deps?: string[],
) => void;


component('demo-button', () => {
	const [ counter, setCounter ] = useState('counter', 0, { type: Number });

	useWillUpdate((props, element) => {
		// Called during the willUpdate lifecycle method
		// whenever the reactive property: counter is updated.
	}, [ 'counter' ]);

	return () => html`
	<button @click=${() => setCounter(counter.value + 1)}>
		${counter.value}
	</button>
	`;
}).register();
```


## useUpdate
Attaches logic to the LitElement `update` method.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseUpdate = (
	func: (changedProps: PropertyValues, element: LitElement) => void,
	deps?: string[],
) => void;


component('demo-button', () => {
	const [ counter, setCounter ] = useState('counter', 0, { type: Number });

	useUpdate((props, element) => {
		// Called during the update lifecycle method
		// whenever the reactive property: counter is updated.
	}, [ 'counter' ]);

	return () => html`
	<button @click=${() => setCounter(counter.value + 1)}>
		${counter.value}
	</button>
	`;
}).register();
```


## useUpdated
Attaches logic to the LitElement `update` method.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseUpdated = (
	func: (changedProps: PropertyValues, element: LitElement) => void,
	deps?: string[],
) => void;


component('demo-button', () => {
	const [ counter, setCounter ] = useState('counter', 0, { type: Number });

	useUpdate((props, element) => {
		// Called during the updated lifecycle method
		// whenever the reactive property: counter is updated.
	}, [ 'counter' ]);

	return () => html`
	<button @click=${() => setCounter(counter.value + 1)}>
		${counter.value}
	</button>
	`;
}).register();
```


## useController
Attaches a `ReactiveController` to the component instance.
<br>[Back to list of hooks.](#list-of-available-hooks)

```typescript
type UseController = <T extends ReactiveController = ReactiveController>(
	name: string,
	controller: T,
) => ({ value: T; });


component('demo-button', () => {
	useController('testController', {
		hostConnected() {
			// Runs during the components connectedCallback hook.
		},
		hostUpdate() {
			// Runs during the components update hook.
		},
		hostDisconnected() {
			// Runs during the components disconnectedCallback hook.
		},
	});

	return () => html`
	<button></button>
	`;
}).register();
```


## License
MIT