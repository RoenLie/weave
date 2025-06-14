# jsx-lit

A JSX runtime and Vite plugin that transforms JSX into Lit templates at compile time, enabling you to write JSX syntax that compiles to efficient lit-html templates.

## Features

```tsx
function renderInput({ name, disabled, checked, value, ref }) {
  return (
    <input
      id       ="input"            // static    assignment
      name     ={name}             // attribute assignment (default)
      disabled ={as.bool(disabled)} // boolean   assignment
      value    ={as.prop(value)}   // property  assignment
      classList={{active: true}}   // classMap  assignment
      styleList={{color: 'blue'}}  // styleMap  assignment
      ref      ={ref}              // ref       assignment
      {...{role: 'button'}}        // spread    assignment
    />
  );
}
```

## New in this version
- 🎯 **Function Components**: Full support for JSX function components with automatic props object creation
- 🔄 **Attribute Binding Default**: Expressions now bind as attributes by default instead of properties
- 🎛️ **Enhanced Binding Control**: Use `as.prop()` and `as.bool()` compile-time annotations for precise control over binding types
- 📦 **Custom Element Integration**: Improved `toJSX()` function for type-safe custom element components
- 🏷️ **Dynamic Tag Names**: Enhanced support for conditional and polymorphic element types

**Quick Example of New Features:**
```tsx
// Function Components - Now Fully Supported!
const Card = ({ title, content, variant = 'default', onAction }) => (
  <div classList={{ [`card-${variant}`]: true }}>
    <h3>{title}</h3>
    <p>{content}</p>
    <button on-click={onAction}>Action</button>
  </div>
);

// Enhanced Property Binding (NEW: defaults to properties)
function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div>
      <input 
        type="checkbox"
        checked={as.prop(todo.completed)}    // Property binding with as.prop()
        data-id={todo.id}                    // Attribute binding (NEW default)
        disabled={as.bool(todo.readonly)}   // Boolean attribute with as.bool()
        on-change={() => onToggle(todo.id)}
      />
      <span classList={{ completed: todo.completed }}>
        {todo.text}
      </span>
      <Card 
        title="Actions"
        content="Manage this todo"
        variant="compact"
        onAction={() => onDelete(todo.id)}
      />
    </div>
  );
}
```

## Transformation modes: React JSX runtime and custom JSX compiler
- ⚡ **Compile-time transformation**: JSX is transformed to lit-html templates during build
- 🎯 **Type-safe**: Full TypeScript support with proper JSX type definitions
- 🔧 **Vite integration**: Easy setup with Vite plugins
- 📦 **Zero runtime overhead**: The custom compiler produces native lit-html code
- 🎨 **Lit ecosystem compatibility**: Works seamlessly with Lit directives and features
- 🎛️ **Flexible binding control**: Use `as.prop()` and `as.bool()` compile-time annotations to control how values are bound
- 📦 **Custom element integration**: Use `toJSX()` function for type-safe custom element components
- 🏷️ **Dynamic tag names**: Support for conditional and polymorphic element types
- 🎯 **Function Components**: Full support for function components that return JSX

## Installation

```bash
npm install jsx-lit
# or
pnpm add jsx-lit
# or
yarn add jsx-lit
```

## Quick Start

### Method 1: Custom JSX Compiler (Recommended)

This is the preferred method as it produces native lit-html templates with zero runtime overhead.

```typescript
// vite.config.ts
import { litJsx } from 'jsx-lit/vite-jsx-preserve';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [litJsx()],
});
```

### Method 2: React JSX Runtime

This method uses React's JSX transformation and converts the result to lit-html at runtime.

```typescript
// vite.config.ts
import { litJsx } from 'jsx-lit/vite-jsx-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [litJsx()],
});
```

## TypeScript Configuration

The TypeScript configuration depends on which transformation mode you're using.

### For Custom JSX Compiler (vite-jsx-preserve)

When using the custom compiler, configure your `tsconfig.json` to preserve JSX:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "jsx-lit",
  }
}
```

This configuration:
- `"jsx": "preserve"` - Keeps JSX syntax intact for the custom compiler to transform
- `"jsxImportSource": "jsx-lit"` - Tells TypeScript where to find JSX types

### For React JSX Runtime (vite-jsx-react)

When using the React JSX runtime mode, configure automatic JSX transformation:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "jsx-lit",
  }
}
```

This configuration:
- `"jsx": "react-jsx"` - Enables automatic JSX transformation
- `"jsxImportSource": "jsx-lit"` - Tells TypeScript where to find JSX types

## Configuration

### Custom JSX Compiler Options

The custom compiler plugin accepts optional Babel configuration:

```typescript
// vite.config.ts
import { litJsx } from 'jsx-lit/vite-jsx-preserve';

export default defineConfig({
  plugins: [
    litJsx({
      babel: {
        // Babel transform options
        plugins: ['@babel/plugin-proposal-decorators'],
      },
      // Or use a function for dynamic configuration
      babel: (code, id) => ({
        plugins: id.includes('legacy') ? [] : ['modern-plugin'],
      }),
    }),
  ],
});
```

## JSX Syntax Support

### Basic Elements

```tsx
// Input JSX
(<div class="my-class" id="my-id">
	<span>Hello World</span>
</div>)

// Compiled output (approximate)
html`
<div class="my-class" id="my-id">
  <span>Hello World</span>
</div>`
```

### Dynamic Content

```tsx
const name = 'World';
const isVisible = true;

return (
  <div>
    <h1>Hello {name}!</h1>
    {isVisible && <p>This is visible</p>}
  </div>
);
```

### Function Components

jsx-lit fully supports function components that return JSX. They are compiled to efficient function calls with props objects:

```tsx
// Define a function component
function Button({ label, variant = 'primary', disabled, onClick, children }) {
  return (
    <button 
      classList={{ [`btn-${variant}`]: true, 'disabled': disabled }}
      disabled={as.bool(disabled)}
      on-click={onClick}
    >
      {label || children}
    </button>
  );
}

// Use the function component
function App() {
  return (
    <div>
      <Button 
        label="Click me" 
        variant="primary" 
        onClick={() => alert('Clicked!')} 
      />
      
      <Button disabled={true}>
        <span>Disabled Button</span>
      </Button>
    </div>
  );
}
```

**How Function Components Compile:**

```tsx
// Input JSX
<Button label="Submit" onClick={handleSubmit} disabled={false}>
  <Icon name="send" />
</Button>

// Compiles to:
html`${Button({
  label: "Submit",
  onClick: handleSubmit,
  disabled: false,
  children: html`<${Icon({ name: "send" })} />`
})}`
```

**Function Component Features:**
- Props are passed as a single object parameter
- Children are passed via the `children` property
- Support all JSX features including conditional rendering, loops, and event handlers
- Can be composed and nested like regular JSX elements
- Compile to efficient function calls with zero runtime overhead

### Event Handlers

```tsx
(<button on-click={() => console.log('clicked')}>
	Click me
</button>)

html`
<button @click={() => console.log('clicked')}>
	Click me
</button>
`
```

### classList Attribute

The `classList` attribute works with object values and compiles to lit-html's `classMap` directive:

```tsx
function renderButton() {
  const isActive = true;
  const isPrimary = false;

  return (
    <button classList={{ active: isActive, primary: isPrimary }}>
      Click me
    </button>
  );
}

// Compiles to:
html`<button class=${classMap({ active: isActive, primary: isPrimary })}>Click me</button>`
```

### styleList Attribute

The `styleList` attribute works with object values and compiles to lit-html's `styleMap` directive:

```tsx
function renderStyledDiv() {
  const styles = {
    color: 'red',
    fontSize: '16px',
    display: 'block'
  };

  return <div styleList={styles}>Styled content</div>;
}

// Compiles to:
html`<div style=${styleMap(styles)}>Styled content</div>`
```

### Spread Syntax

Spread syntax on JSX elements is handled by the custom `RestDirective`:

```tsx
function renderSpreadDiv() {
  const props = {
    id: 'my-id',
    'data-test': 'value',
    className: 'my-class'
  };

  return <div {...props}>Content</div>;
}

// Compiles to use RestDirective which applies properties/attributes at runtime
html`<div ${__$rest(props)}>Content</div>`
```

### Attribute Processing and Value Binding

jsx-lit provides fine-grained control over how values are bound to elements through binding functions and automatic type detection:

#### Default Binding Behavior

By default, expressions in JSX attributes are bound as attribute assignments:

```tsx
function renderInputWithDefaults({ disabled, checked, value }) {
  return (
    <input
      checked={checked}   // Attribute assignment: checked="${checked}"
      disabled={disabled} // Attribute assignment: disabled="${disabled}"
      value={value}       // Attribute assignment: value="${value}"
    />
  );
}
```

#### Binding Functions

jsx-lit provides binding functions that allow you to control how values are assigned:

##### `as.prop()` - Force Property Binding

Use `as.prop()` to bind values as DOM properties instead of attributes:

```tsx
function renderInputWithProperties({ customValue, inputValue }) {
  return (
    <input
      value={as.prop(inputValue)}          // Binds as: .value=${inputValue}
      checked={as.prop(isChecked)}         // Binds as: .checked=${isChecked}
      
      // Alternative syntax
      disabled={prop => isDisabled}       // Binds as: .disabled=${isDisabled}
    />
  );
}

// Compiles to:
html`<input .value=${inputValue} .checked=${isChecked} .disabled=${isDisabled}>`
```

**Note:** `as.prop()` and `prop =>` are compile-time type annotations that tell the jsx-lit compiler how to bind the value. They are not runtime functions.

##### `as.bool()` - Force Boolean Attribute Binding

Use `as.bool()` to bind values as boolean attributes using lit-html's `?` syntax:

```tsx
function renderButton({ disabled, hidden, selected }) {
  return (
    <button
      disabled={as.bool(disabled)}         // Binds as: ?disabled=${disabled}
      hidden={as.bool(hidden)}             // Binds as: ?hidden=${hidden}
      aria-selected={as.bool(selected)}    // Binds as: ?aria-selected=${selected}
      
      // Alternative syntax
      readonly={bool => isReadonly}        // Binds as: ?readonly=${isReadonly}
    />
  );
}

// Compiles to:
html`<button ?disabled=${disabled} ?hidden=${hidden} ?aria-selected=${selected}></button>`
```

#### Attribute Processing Table

| Attribute Type | Default Binding | lit-html Syntax | Example |
|---------------|----------------|-----------------|---------|
| Expression containers | Attribute assignment | `attribute=${value}` | `checked={value}` → `checked=${value}` |
| `as.prop()` wrapped | Property binding | `.property=${value}` | `value={as.prop(val)}` → `.value=${val}` |
| `as.bool()` wrapped | Boolean attribute | `?attribute=${value}` | `disabled={as.bool(flag)}` → `?disabled=${flag}` |
| Alternative syntax | Property binding | `.property=${value}` | `value={prop => val}` → `.value=${val}` |
| Alternative syntax | Boolean attribute | `?attribute=${value}` | `disabled={bool => flag}` → `?disabled=${flag}` |
| Event handlers (`on-*`) | Event binding | `@event=${handler}` | `on-click={handler}` → `@click=${handler}` |
| String literals | Attribute binding | `attribute="value"` | `class="btn"` → `class="btn"` |
| `classList` | Class map directive | `class=${classMap(obj)}` | `classList={obj}` → `class=${classMap(obj)}` |
| `styleList` | Style map directive | `style=${styleMap(obj)}` | `styleList={obj}` → `style=${styleMap(obj)}` |
| `ref` | Ref directive | `${ref(refObj)}` | `ref={refObj}` → `${ref(refObj)}` |

#### When to Use Each Binding Type

**Attribute Assignment (Default)**
- For custom attributes or data attributes
- When you need the value to appear in the HTML as an attribute
- For attributes that don't have corresponding properties
- When working with libraries that expect attributes

**Property Binding (`as.prop()` or `prop =>` syntax)**
- For standard DOM properties like `value`, `checked`, `disabled`
- When you want the element to handle the value according to its property setter
- For interactive elements that need live property updates

**Boolean Attribute Binding (`as.bool()` or `bool =>` syntax)**
- For boolean HTML attributes like `disabled`, `hidden`, `readonly`
- When you want presence/absence semantics (attribute present = true, absent = false)
- For accessibility attributes that should follow boolean attribute patterns

#### Examples and Best Practices

**Form Elements**
```tsx
function renderForm({ formData, errors }) {
  return (
    <form>
      {/* Standard property bindings */}
      <input
        type="email"
        value={formData.email}           // Property: element.value = formData.email
        required={formData.emailRequired} // Property: element.required = formData.emailRequired
      />

      {/* Boolean attribute for validation state */}
      <input
        type="password"
        value={formData.password}
        aria-invalid={as.bool(errors.password)} // Boolean attr: ?aria-invalid=${errors.password}
      />

      {/* Custom data attributes */}
      <button
        type="submit"
        data-form-id={as.attr(formData.id)}      // Attribute: data-form-id="${formData.id}"
        data-step={as.attr(formData.currentStep)} // Attribute: data-step="${formData.currentStep}"
      >
        Submit
      </button>
    </form>
  );
}
```

**Custom Elements**
```tsx
function renderCustomElement({ config, state }) {
  return (
    <my-component
      // Properties for complex data
      config={config}                    // Property: element.config = config
      items={state.items}               // Property: element.items = state.items

      // Attributes for simple values and styling
      theme={as.attr(state.theme)}       // Attribute: theme="${state.theme}"
      size={as.attr(config.size)}        // Attribute: size="${config.size}"

      // Boolean attributes for state
      loading={as.bool(state.isLoading)} // Boolean attr: ?loading=${state.isLoading}
      disabled={as.bool(!state.isReady)} // Boolean attr: ?disabled=${!state.isReady}
    />
  );
}
```

**Accessibility Attributes**
```tsx
function renderAccessibleComponent({ expanded, selected, level }) {
  return (
    <div
      role="treeitem"
      tabindex={as.attr(0)}                    // Attribute: tabindex="0"
      aria-level={as.attr(level)}              // Attribute: aria-level="${level}"
      aria-expanded={as.bool(expanded)}        // Boolean attr: ?aria-expanded=${expanded}
      aria-selected={as.bool(selected)}       // Boolean attr: ?aria-selected=${selected}
    >
      Tree Item Content
    </div>
  );
}
```

### Lit Directives

jsx-lit works seamlessly with all Lit directives:

```tsx
import { when } from 'lit-html/directives/when.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { guard } from 'lit-html/directives/guard.js';
import { ifDefined } from 'lit-html/directives/if-defined.js';

return (
  <div>
    {when(condition, () => <p>Conditional content</p>)}
    {repeat(items, item => item.id, item => <li>{item.name}</li>)}
    {guard([expensiveData], () => <ExpensiveComponent data={expensiveData} />)}
    <input value={ifDefined(optionalValue)} />
  </div>
);
```

### References (ref attribute)

The `ref` attribute is automatically wrapped with the `ref` directive:

```tsx
import { createRef } from 'lit-html/directives/ref.js';

function renderRef() {
  const buttonRef = createRef();

  return <button ref={buttonRef}>Click me</button>;
}

// Compiles to:
html`<button ${ref(buttonRef)}>Click me</button>`
```

### Event Handler Conversion

JSX event handlers use the `on-` syntax and are automatically converted to lit-html's `@` syntax:

```tsx
// JSX syntax (only on- format supported)
<button on-click={handler}>Click</button>           // on-click -> @click
<button on-dblclick={handler}>Double Click</button> // on-dblclick -> @dblclick
<button on-input={handler}>Input</button>           // on-input -> @input
<button on-change={handler}>Change</button>         // on-change -> @change

// All compile to:
html`<button @click=${handler}>Click</button>`
html`<button @dblclick=${handler}>Double Click</button>`
html`<button @input=${handler}>Input</button>`
html`<button @change=${handler}>Change</button>`
```

### Complex Example

Here's a comprehensive example showing multiple features working together:

```tsx
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { when } from 'lit-html/directives/when.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { createRef } from 'lit-html/directives/ref.js';

@customElement('todo-list')
export class TodoList extends LitElement {
  @property({ type: Array }) items = [];
  @state() private newItemText = '';
  @state() private filter = 'all';

  private inputRef = createRef();

  static styles = css`
    .container { padding: 1rem; }
    .completed { text-decoration: line-through; opacity: 0.6; }
    .filters button.active { background: blue; color: white; }
  `;

  addItem() {
    if (this.newItemText.trim()) {
      this.items = [...this.items, {
        id: Date.now(),
        text: this.newItemText,
        completed: false
      }];
      this.newItemText = '';
      this.inputRef.value?.focus();
    }
  }

  toggleItem(id) {
    this.items = this.items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
  }

  get filteredItems() {
    switch (this.filter) {
      case 'active': return this.items.filter(item => !item.completed);
      case 'completed': return this.items.filter(item => item.completed);
      default: return this.items;
    }
  }

  render() {
    return (
      <div class="container">
        <h1>Todo List</h1>

        {/* Add new item form */}
        <div class="add-form">
          <input
            ref={this.inputRef}
            value={this.newItemText}
            on-input={(e) => { this.newItemText = e.target.value; }}
            on-keydown={(e) => { if (e.key === 'Enter') this.addItem(); }}
            placeholder="Add new todo..."
          />
          <button on-click={this.addItem} disabled={!this.newItemText.trim()}>
            Add
          </button>
        </div>

        {/* Filter buttons */}
        <div class="filters">
          {['all', 'active', 'completed'].map(filterType => (
            <button
              key={asAttr(filterType)}
              classList={{ active: this.filter === filterType }}
              on-click={() => { this.filter = filterType; }}
            >
              {filterType}
            </button>
          ))}
        </div>

        {/* Todo items */}
        {when(this.filteredItems.length > 0, () => (
          <ul>
            {repeat(this.filteredItems, item => item.id, item => (
              <li key={asAttr(item.id)} classList={{ completed: item.completed }}>
                <input
                  type="checkbox"
                  checked={asBool(item.completed)}
                  on-change={() => this.toggleItem(item.id)}
                />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        ), () => (
          <p>No items to show</p>
        ))}

        {/* Summary */}
        <div class="summary">
          <span>
            {this.items.filter(item => !item.completed).length} items left
          </span>
        </div>
      </div>
    );
  }
}
```

### Slots

```tsx
<my-component>
  <span slot="header">Header Content</span>
  <div>Default slot content</div>
</my-component>
```

### Dynamic Tag Names

jsx-lit supports dynamic tag names through Component variables. When you use a variable that contains a tag name as a JSX element, jsx-lit will automatically handle it as a dynamic tag and compile it to use lit-html's static templates with `unsafeStatic`.

```tsx
// Dynamic tag name based on condition
const Tag = this.href ? 'a' : 'span';

return (
  <Tag href={this.href} class="dynamic-element">
    Content
  </Tag>
);
```

**Compiled Output:**
```javascript
import { html as htmlStatic } from 'lit-html/static.js';

// jsx-lit automatically creates a literal map entry for the dynamic tag
const __$Tag = __$literalMap.get(Tag);

return htmlStatic`
  <${__$Tag} href=${this.href} class="dynamic-element">
    Content
  </${__$Tag}>
`;
```

**How It Works:**

1. **Detection**: jsx-lit detects Component variables (PascalCase identifiers) and treats them as dynamic tags
2. **Literal Map**: Creates an entry in `__$literalMap` using the variable name
3. **Static Template**: Uses `htmlStatic` instead of regular `html` to allow for otherwise invalid templates.
4. **Automatic Import**: Injects the necessary imports for static templates and the literal map

**Use Cases:**

```tsx
// Conditional element types
const linkOrSpan = ({ href, children }) => {
  const Tag = href ? 'a' : 'span';
  return <Tag href={href}>{children}</Tag>;
};

// Dynamic custom elements
const renderWidget = ({ type, data }) => {
  const WidgetTag = `my-${type}-widget`;
  return <WidgetTag data={data} />;
};

// Polymorphic components
const heading = ({ level, children }) => {
  const Tag = `h${level}`;
  return <Tag>{children}</Tag>;
};
```

**Requirements:**

- The variable must be in scope when the JSX is processed
- The variable should contain a valid HTML tag name or custom element name
- Component variable names should follow PascalCase convention to be detected properly

## Component Patterns

### Component Types

jsx-lit supports two types of components:

#### Function Components

**Function components** that return JSX are fully supported and compile to efficient call expressions:

```tsx
// ✅ Supported - Function component
const MyButton = ({ label, onClick, disabled }) => (
  <button disabled={disabled} on-click={onClick}>
    {label}
  </button>
);

// Usage
<MyButton label="Click me" onClick={() => console.log('clicked')} disabled={false} />

// Compiles to:
html`${MyButton({
  label: "Click me",
  onClick: () => console.log('clicked'),
  disabled: false
})}`
```

Function components:
- Receive props as a single object parameter
- Can receive `children` as a `children` property in props
- Are called directly as functions in the compiled output
- Support all JSX features including conditional rendering and loops

#### Component Variables (Tag Names)

**Component variables** that return tag name strings are also supported for dynamic element types:

```tsx
// ✅ Supported - Component variable returning tagName
const MyButton = 'my-button';
<MyButton>Click me</MyButton>

// ❌ Not supported - Component variable returning JSX
const MyButton = <button>Click me</button>;
<MyButton />
```

### Custom Elements

```tsx
import { toJSX } from 'jsx-lit';

// Define your custom element
export class MyButton extends LitElement {
  static tagName = 'my-button';

  render() {
    return (
      <button>
        <slot />
      </button>
    );
  }
}

customElements.define(MyButton.tagName, MyButton);

// Use in JSX
const ButtonTag = toJSX(MyButton);
<ButtonTag>Click me</ButtonTag>
```

### The toJSX Function

The `toJSX` function is a utility that creates JSX-compatible component variables from custom element classes. It provides type-safe integration between custom elements and jsx-lit's Component variable system.

```tsx
import { toJSX } from 'jsx-lit';
```

**Function Signature:**
```tsx
function toJSX<T extends { new(...args: any): any; tagName: string; }>(
  element: T
): (props: JSX.JSXProps<InstanceType<T>>) => string
```

**What it does:**

1. **Automatic Registration**: Registers the custom element if not already defined
2. **Component Variable Creation**: Returns the tag name string for use as a JSX Component variable
3. **Type Safety**: Provides TypeScript intellisense and type checking for component properties
4. **JSX Integration**: Enables using custom elements with jsx-lit's dynamic tag name syntax

**Example Usage:**

```tsx
import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { toJSX } from 'jsx-lit';

// Define a custom element with typed properties
export class MyButton extends LitElement {
  static tagName = 'my-button';

  @property() variant: 'primary' | 'secondary' = 'primary';
  @property() disabled = false;
  @property() size: 'small' | 'medium' | 'large' = 'medium';

  render() {
    return html`
      <button
        ?disabled=${this.disabled}
        class="btn btn-${this.variant} btn-${this.size}"
      >
        <slot></slot>
      </button>
    `;
  }
}

// Create JSX component variable with type safety
const Button = toJSX(MyButton);

// Use in JSX with full TypeScript support
function renderApp() {
  return (
    <div>
      <Button variant="primary" size="large" on-click={handleClick}>
        Click me!
      </Button>

      <Button
        variant="secondary"
        disabled={true}
        on-click={handleSecondaryClick}
      >
        Secondary action
      </Button>
    </div>
  );
}
```

**Registration Behavior:**

- If the element class has a `register()` method, it will be called
- Otherwise, `customElements.define(element.tagName, element)` is called automatically
- If already registered, no error is thrown (safe to call multiple times)

**TypeScript Integration:**

The `toJSX` function provides full TypeScript support by leveraging the `JSX.JSXProps<T>` interface:

```tsx
// TypeScript will provide intellisense for:
// - variant: 'primary' | 'secondary'
// - disabled: boolean
// - size: 'small' | 'medium' | 'large'
// - Standard HTML attributes (class, id, etc.)
// - Event handlers (on-click, on-change, etc.)
const Button = toJSX(MyButton);

<Button
  variant="primary"    // ✅ Type-safe property
  disabled={false}     // ✅ Type-safe property
  invalidProp="test"   // ❌ TypeScript error
/>
```

**Relationship to Dynamic Tag Names:**

The `toJSX` function creates Component variables that work seamlessly with jsx-lit's dynamic tag name system:

```tsx
const Button = toJSX(MyButton);        // Creates component variable
const Input = toJSX(MyInput);          // Creates component variable

// Both compile to efficient static templates using __$literalMap
function renderForm({ useButton }) {
  const SubmitComponent = useButton ? Button : Input;
  return <SubmitComponent type="submit">Submit</SubmitComponent>;
}
```

This compiles to:
```javascript
import { htmlStatic, __$literalMap } from 'jsx-lit';

function renderForm({ useButton }) {
  const SubmitComponent = useButton ? Button : Input;
  const __$SubmitComponent = __$literalMap.get('SubmitComponent');
  return htmlStatic`<${__$SubmitComponent} type="submit">Submit</${__$SubmitComponent}>`;
}
```

## How jsx-lit Works

### Transformation Modes Explained

jsx-lit provides two different approaches to transforming JSX into lit-html templates, each with its own benefits and trade-offs.

#### Custom JSX Compiler Mode (vite-jsx-preserve)

This mode uses a custom Babel transform to directly convert JSX syntax into lit-html template literals at compile time.

**Input JSX:**
```tsx
function renderExample({ name, active }) {
  return (
    <div classList={{ active }} styleList={{ color: 'red' }}>
      <h1>Hello {name}!</h1>
      <button on-click={() => console.log('clicked')}>Click me</button>
    </div>
  );
}
```

**Compiled Output:**
```javascript
import { html } from 'lit-html';
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';

function renderExample({ name, active }) {
  return html`
    <div class=${classMap({ active })} style=${styleMap({ color: 'red' })}>
      <h1>Hello ${name}!</h1>
      <button @click=${() => console.log('clicked')}>Click me</button>
    </div>
  `;
}
```

**Benefits:**
- ⚡ Zero runtime overhead - produces native lit-html code
- 📦 Smaller bundle size - no JSX runtime needed
- 🎯 Direct integration with lit-html ecosystem
- 🔧 Automatic import injection for directives

#### React JSX Runtime Mode (vite-jsx-react)

This mode leverages React's JSX transformation and converts the result to lit-html at runtime using a custom JSX factory.

**Input JSX:**
```tsx
function renderExample({ name, active }) {
  return (
    <div classList={{ active }} styleList={{ color: 'red' }}>
      <h1>Hello {name}!</h1>
      <button on-click={() => console.log('clicked')}>Click me</button>
    </div>
  );
}
```

**Intermediate (React JSX):**
```javascript
import { jsx } from 'jsx-lit/jsx-runtime';

function renderExample({ name, active }) {
  return jsx('div', {
    classList: { active },
    styleList: { color: 'red' },
    children: [
      jsx('h1', { children: ['Hello ', name, '!'] }),
      jsx('button', { 'on-click': () => console.log('clicked'), children: 'Click me' })
    ]
  });
}
```

**Runtime Output (lit-html):**
```javascript
// The jsx() function converts the React-style calls to lit-html templates
function renderExample({ name, active }) {
  return html`
    <div class=${classMap({ active })} style=${styleMap({ color: 'red' })}>
      <h1>Hello ${name}!</h1>
      <button @click=${() => console.log('clicked')}>Click me</button>
    </div>
  `;
}
```

**Benefits:**
- 🔄 Familiar React JSX transformation
- 🛠️ Works with existing React tooling
- 🔧 Easier to debug (intermediate React JSX is visible)
- 📱 Good for migration from React projects

### Attribute Processing Details

jsx-lit handles different types of attributes intelligently:

| Attribute Type | JSX Input | lit-html Output | Binding Syntax |
|---------------|-----------|-----------------|----------------|
| **classList** | `classList={{ active: true }}` | `class=${classMap({ active: true })}` | Attribute binding |
| **styleList** | `styleList={{ color: 'red' }}` | `style=${styleMap({ color: 'red' })}` | Attribute binding |
| **event handler** | `on-click={handler}` | `@click=${handler}` | Event binding |
| **boolean/conditional** | `disabled={true}` | `.disabled=${true}` | Property binding |
| **ref** | `ref={myRef}` | `${ref(myRef)}` | Element directive |
| **spread** | `{...props}` | `${__$rest(props)}` | Element directive |
| **string/number** | `id="my-id"` | `id="my-id"` | Attribute binding |
| **expression** | `value={expr}` | `.value=${expr}` | Property binding |

### Import Management

The custom compiler automatically adds required imports:

```tsx
// Your JSX code
<div classList={{ active }} styleList={{ color: 'red' }} ref={myRef}>
  Content
</div>

// Automatically added imports
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { ref } from 'lit-html/directives/ref.js';
```

This ensures your bundles only include the directives you actually use.

## Comparison: Custom Compiler vs React JSX

| Feature | Custom Compiler | React JSX Runtime |
|---------|----------------|-------------------|
| **Performance** | ⚡ Zero runtime overhead | 🔄 Runtime conversion |
| **Bundle Size** | 📦 Smaller bundles | 📦 Larger bundles (+JSX runtime) |
| **lit-html Integration** | 🎯 Native templates | 🔄 Converted at runtime |
| **Build Speed** | ⚡ Faster builds | 🔄 Standard React JSX speed |
| **Debugging** | 🎯 Direct lit-html output | 🔍 Intermediate React JSX visible |
| **Tooling** | 🔧 Custom transform | 🛠️ Standard React tooling |
| **Migration** | 📝 Requires JSX preserve mode | 🔄 Easy from React projects |
| **Import Management** | 🤖 Automatic directive imports | 📦 Manual import management |
| **TypeScript Support** | ✅ Full support | ✅ Full support |
| **Source Maps** | ✅ Supported | ✅ Supported |

### When to Choose Which Mode

**Choose Custom Compiler (`vite-jsx-preserve`) when:**
- Performance is critical (production apps)
- Bundle size matters
- You want the most efficient lit-html integration
- Starting a new project with jsx-lit
- You want to use function components (full support)

**Choose React JSX Runtime (`vite-jsx-react`) when:**
- You need gradual migration from React projects
- You prefer React-style JSX transformation
- You're prototyping or in development phase

## Advanced Usage

### Working with Refs

```tsx
import { createRef } from 'lit-html/directives/ref.js';

class MyElement extends LitElement {
  private buttonRef = createRef<HTMLButtonElement>();

  render() {
    return (
      <button ref={this.buttonRef}>
        Click me
      </button>
    );
  }
}
```

### Conditional Rendering

```tsx
render() {
  return (
    <div>
      {this.showHeader && <header>My Header</header>}
      {this.items.length > 0 ? (
        <ul>
          {this.items.map(item => <li key={item.id}>{item.name}</li>)}
        </ul>
      ) : (
        <p>No items found</p>
      )}
    </div>
  );
}
```

### Styling

```tsx
import { css } from 'lit';

class MyElement extends LitElement {
  static styles = css`
    .container {
      padding: 1rem;
      background: var(--background-color);
    }
  `;

  render() {
    return (
      <div class="container">
        <slot />
      </div>
    );
  }
}
```

## Debugging

### Source Maps

Both transformation modes support source maps for debugging:

## Migration Guide

### From lit-html Templates

```tsx
// Before
render() {
  return html`
    <div class="container">
      <h1>${this.title}</h1>
      <button @click=${this.handleClick}>Click</button>
    </div>
  `;
}

// After
render() {
  return (
    <div class="container">
      <h1>{this.title}</h1>
      <button on-click={this.handleClick}>Click</button>
    </div>
  );
}
```

### From React

Most React JSX patterns work with jsx-lit, but note these differences:

- Use `class` instead of `className`
- Event handlers use `on-{insert event name here}` syntax
- No React-specific features (hooks, components, etc.)

## Performance Tips

1. **Use the custom compiler** for production builds to eliminate runtime overhead
2. **Minimize dynamic expressions** in JSX for better template caching
3. **Use Lit directives** like `when` and `repeat` for conditional and list rendering

## Troubleshooting

### Common Issues

**JSX not transforming**
- Ensure your files have `.jsx` or `.tsx` extensions
- Check that the plugin is properly configured in `vite.config.ts`
- Verify your `tsconfig.json` has the correct `jsx` setting for your chosen mode
- Make sure you're importing from the correct plugin (`vite-jsx-preserve` vs `vite-jsx-react`)

**TypeScript errors**
- Add `"jsx-lit"` to your `jsxImportSource` property in `tsconfig.json`
- For custom compiler: Set `"jsx": "preserve"` in compiler options
- For React runtime: Set `"jsx": "react-jsx"` in compiler options
- Ensure you have `@types/react` installed if using React JSX mode

**Runtime errors**
- Function components should return JSX elements, component variables should return tagNames
- Ensure custom elements are properly defined before use
- Check that event handlers use the correct `on-` syntax (not `onClick` or other React formats)
- For boolean attributes, use `as.bool()` function to get boolean attribute binding
- For DOM properties, use `as.prop()` function to get property binding instead of attribute binding

**Build errors**
- `Cannot resolve 'jsx-lit/jsx-runtime'`: You're using React JSX mode but importing from wrong path
- `Cannot find directive imports`: Custom compiler mode needs `"jsx": "preserve"` in tsconfig
- Babel transform errors: Check your babel configuration in the plugin options

**Performance issues**
- Avoid creating new objects/functions in JSX expressions on every render
- Use `lit-html` directives like `guard()` for expensive computations
- Consider switching to custom compiler mode for better performance

**Directive issues**
- `classMap is not defined`: Ensure automatic imports are working or manually import directives
- `styleMap is not defined`: Same as above - check import configuration
- Spread syntax not working: Verify `RestDirective` is available and imported

**Function component issues**
- Component not rendering: Ensure the function returns JSX elements, not strings or other values
- Props not passed correctly: Check that props are destructured from the first parameter object
- Children not working: Access children via `props.children` in function components
- TypeScript errors: Ensure function component signatures match `(props: any) => JSX.Element`

### Debugging Tips

1. **Check compiled output**: Use browser dev tools to see the actual generated code
2. **Use source maps**: Both modes support source maps for debugging
3. **Verify binding syntax**: Check that attributes compile to the expected lit-html binding syntax (`.`, `?`, `@`, etc.)
4. **Test directive imports**: Ensure required lit-html directives are properly imported
5. **Function component debugging**: Check that function components are called with correct props objects in compiled output

### Migration Checklist

**From lit-html to jsx-lit:**
- [ ] Change `html` template literals to JSX syntax
- [ ] Update event handlers from `@click` to `on-click`
- [ ] Convert `${expression}` to `{expression}`
- [ ] Replace directive usage with JSX attributes where possible
- [ ] Use `as.prop()` for values that need property binding instead of attribute binding
- [ ] Use `as.bool()` for boolean attributes that need `?` syntax binding

**From React to jsx-lit:**
- [ ] Change `className` to `class`
- [ ] Update event handlers from React format (`onClick`) to `on-` format (`on-click`)
- [ ] React function components work directly with jsx-lit (no changes needed!)
- [ ] Replace React-specific features (hooks, state management) with Lit equivalents
- [ ] Replace React components with custom elements where appropriate
- [ ] Update styling approaches (CSS-in-JS to CSS or Lit's styling system)

**Upgrading from jsx-lit 1.0.x:**
- [ ] Expressions now bind as attributes by default (was properties before)
- [ ] Use `as.prop()` if you need the old property binding behavior
- [ ] Function components are now fully supported - you can start using them!
- [ ] `toJSX()` function has improved TypeScript integration

## Performance Optimization

### Best Practices

1. **Use the custom compiler** for production builds
2. **Minimize dynamic expressions** - prefer static content where possible
3. **Use lit-html directives** appropriately:
   ```tsx
   // Good - using guard for expensive operations
   {guard([expensiveData], () => computeExpensiveTemplate(expensiveData))}

   // Good - using when for simple conditionals
   {when(condition, () => <ExpensiveComponent />)}

   // Avoid - creating new objects every render
   <div classList={{ active: this.isActive }}>  // Object created each time
   ```

4. **Cache computed values**:
   ```tsx
   // Good - computed property with caching
   @state() private _filteredItems;
   get filteredItems() {
     if (!this._filteredItems) {
       this._filteredItems = this.items.filter(this.filterFn);
     }
     return this._filteredItems;
   }
   ```

5. **Function component best practices**:
   ```tsx
   // Good - memoize expensive computations outside render
   const ExpensiveComponent = ({ data }) => {
     const processedData = useMemo(() => processData(data), [data]);
     return <div>{processedData}</div>;
   };

   // Good - avoid creating new objects/functions in JSX
   const MyComponent = ({ items, onClick }) => (
     <div>
       {items.map(item => (
         <button key={item.id} on-click={() => onClick(item.id)}>
           {item.name}
         </button>
       ))}
     </div>
   );

   // Better - pre-bind handlers if possible
   const MyComponent = ({ items, onClick }) => {
     const handleClick = (id) => () => onClick(id);
     return (
       <div>
         {items.map(item => (
           <button key={item.id} on-click={handleClick(item.id)}>
             {item.name}
           </button>
         ))}
       </div>
     );
   };
   ```

### Bundle Size Optimization

- Use custom compiler mode to eliminate JSX runtime
- Tree-shake unused directives with proper imports
- Consider using `lit/directives/*` imports for smaller bundles
- Enable Vite's build optimizations and minification

## Contributing

Currently not taking on any additional contributors, but feel free to raise any issue you might encounter and I will try to handle it as soon as I am able.

## License

Apache-2.0

## Related Projects

- [Lit](https://lit.dev/) - Simple. Fast. Web Components.
- [lit-html](https://lit.dev/docs/libraries/lit-html/) - Efficient, Expressive, Extensible HTML templates in JavaScript
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling

---

Made with ❤️ for the Lit community
