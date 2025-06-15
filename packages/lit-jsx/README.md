# jsx-lit

A custom JSX compiler and Vite plugin that transforms JSX into native Lit templates at compile time with zero runtime overhead.

## Features

```tsx
function Input({ name, disabled, checked, value, ref }) {
  return (
    <input
      id       ="input"             // static    assignment
      name     ={name}              // attribute assignment (default)
      disabled ={as.bool(disabled)} // boolean   assignment
      value    ={as.prop(value)}    // property  assignment
      classList={{active: true}}    // classMap  assignment
      styleList={{color: 'blue'}}   // styleMap  assignment
      ref      ={ref}               // ref       assignment
      {...{role: 'button'}}         // spread    assignment
    />
  );
}
```

**Quick Example:**
```tsx
// Function Components - Fully Supported!
const Card = ({ title, content, variant = 'default', onAction }) => (
  <div classList={{ [`card-${variant}`]: true }}>
    <h3>{title}</h3>
    <p>{content}</p>
    <button on-click={onAction}>Action</button>
  </div>
);

// Property Binding (defaults to attributes)
function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div>
      <input
        type="checkbox"
        checked={as.prop(todo.completed)} // Property binding with as.prop()
        data-id={todo.id}                 // Attribute binding (default)
        disabled={as.bool(todo.readonly)} // Boolean attribute with as.bool()
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

// Dynamic Tag Names (.tag property required)
import { toTag } from 'jsx-lit';

function FlexibleContainer({ useSection, children }) {
  const Container = toTag(useSection ? 'section' : 'div');

  return <Container.tag class="container">{children}</Container.tag>;
}
```

## Key Features
- ⚡ **Compile-time transformation**: JSX is transformed to lit-html templates during build
- 🎯 **Type-safe**: Full TypeScript support with proper JSX type definitions
- 🔧 **Vite integration**: Easy setup with Vite plugin
- 📦 **Zero runtime overhead**: Produces native lit-html code with no runtime dependencies
- 🎨 **Lit ecosystem compatibility**: Works seamlessly with Lit directives and features
- 🎛️ **Flexible binding control**: Use `as.prop()` and `as.bool()` compile-time annotations (or `prop =>` and `bool =>` syntax) to control how values are bound
- 📦 **Custom element integration**: Use `toJSX()` function for type-safe custom element components
- 🏷️ **Dynamic tag names**: Support for conditional and polymorphic element types with required `.tag` property pattern
- 🔧 **`toTag()` utility**: Create dynamic tag objects that compile to efficient static templates
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

Configure your Vite plugin to use the jsx-lit custom compiler:

```typescript
// vite.config.ts
import { litJsx } from 'jsx-lit/vite-jsx-preserve';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [litJsx()],
});
```

## TypeScript Configuration

Configure your `tsconfig.json` to preserve JSX syntax for the custom compiler:

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

## Configuration

### Compiler Options

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

// Compiled output
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

jsx-lit provides fine-grained control over how values are bound to elements through binding functions:

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

##### Property and Boolean Binding Functions

jsx-lit provides binding functions to control how values are assigned. Each function has two equivalent syntaxes:

```tsx
function renderFormElement({ inputValue, isChecked, isDisabled, isRequired, isHidden, isReadonly }) {
  return (
    <input
      type="checkbox"

      {/* Property binding - Function syntax */}
      value={as.prop(inputValue)}          // Binds as: .value=${inputValue}

      {/* Boolean attribute binding - Function syntax */}
      disabled={as.bool(isDisabled)}      // Binds as: ?disabled=${isDisabled}

      {/* Property binding - Arrow syntax (alternative) */}
      required={prop => isRequired}       // Binds as: .required=${isRequired}

      {/* Boolean attribute binding - Arrow syntax (alternative) */}
      readonly={bool => isReadonly}       // Binds as: ?readonly=${isReadonly}
    />
  );
}

// Compiles to:
html`<input
  type="checkbox"
  .value=${inputValue}
  ?disabled=${isDisabled}
  .required=${isRequired}
  ?readonly=${isReadonly}
>`
```

**Binding Types:**
- **Property binding** (`as.prop()` or `prop =>`): Binds to DOM properties using `.property=${value}` syntax
- **Boolean attribute binding** (`as.bool()` or `bool =>`): Binds to boolean attributes using `?attribute=${value}` syntax

**Note:** Both function and arrow syntaxes are compile-time annotations that produce identical output. Choose whichever style you prefer.
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

### Dynamic Tag Names

jsx-lit supports dynamic tag names through Component variables with a **required `.tag` property pattern**. This pattern is essential for jsx-lit to detect and compile dynamic tags into efficient lit-html static templates.

#### The `.tag` Property Requirement

**CRITICAL**: Dynamic tag names must use the `.tag` property pattern to compile correctly. jsx-lit specifically looks for this pattern to identify and transform dynamic tags into static templates.

```tsx
import { toTag } from 'jsx-lit';

// ✅ Correct usage - creates { tag: 'div' } object with .tag property
function renderConditional({ useDiv }) {
  const Tag = toTag(useDiv ? 'div' : 'span');
  return <Tag.tag class="dynamic-element">Content</Tag.tag>; // .tag is required!
}
```

**Compiled Output:**
```javascript
import { html as htmlStatic } from 'lit-html/static.js';

// jsx-lit automatically creates a literal map entry for the dynamic tag
const __$Tag_tag = __$literalMap.get(Tag.tag);

return htmlStatic`
  <${__$Tag_tag} class="dynamic-element">
    Content
  </${__$Tag_tag}>
`;
```

#### The `toTag` Utility Function

Use the `toTag` utility to create proper dynamic tag objects:

```tsx
import { toTag } from 'jsx-lit';

// Use in conditional rendering
function renderActionElement({ href, children }) {
  const ActionTag = toTag(href ? 'a' : 'button');

  return (
    <ActionTag.tag href={href} class="action-element">
      {children}
    </ActionTag.tag>
  );
}
```

#### Common Mistakes and Solutions

```tsx
// ❌ WRONG - String variables won't compile to static templates
const badTag = 'div';
return <badTag>Content</badTag>; // jsx-lit can't detect this pattern

// ❌ WRONG - Missing .tag property
const BadTag = toTag('div');
return <BadTag>Content</BadTag>; // Won't compile to static templates

// ❌ WRONG - Direct tag names without toTag wrapper
const Tag = condition ? 'div' : 'span';
return <Tag>Content</Tag>; // Not detected as dynamic component

// ✅ CORRECT - Using toTag with .tag property
const Tag = toTag(condition ? 'div' : 'span');
return <Tag.tag>Content</Tag.tag>; // Compiles to static templates
```

#### How It Works

1. **Pattern Detection**: jsx-lit specifically looks for the `.tag` property pattern to identify dynamic components
2. **Literal Map**: Creates an entry in `__$literalMap` using the tag name value (e.g., 'div', 'span', 'my-custom-element')
3. **Static Template**: Uses `htmlStatic` instead of regular `html` to allow dynamic tag insertion
4. **Automatic Import**: Injects the necessary imports for static templates and the literal map
5. **Type Safety**: The `toTag` function provides proper TypeScript support for HTML elements

#### Advanced Use Cases

```tsx
import { toTag } from 'jsx-lit';

// Conditional element types with proper .tag pattern
const linkOrSpan = ({ href, children }) => {
  const Tag = toTag(href ? 'a' : 'span');
  return <Tag.tag href={href}>{children}</Tag.tag>;
};

// Dynamic custom elements with .tag pattern
const renderWidget = ({ type, data }) => {
  const WidgetTag = toTag(`my-${type}-widget`);
  return <WidgetTag.tag data={data} />;
};

// Polymorphic heading components
const Heading = ({ level, children }) => {
  const HeadingTag = toTag(`h${level}`);
  return <HeadingTag.tag>{children}</HeadingTag.tag>;
};

// Complex conditional rendering
const FormField = ({ multiline, children }) => {
  const FieldTag = toTag(multiline ? 'textarea' : 'input');

  return (
    <div class="form-field">
      <FieldTag.tag placeholder="Enter text...">{children}</FieldTag.tag>
    </div>
  );
};
```

#### Requirements and Best Practices

**Essential Requirements:**
- **Must use `.tag` property**: Dynamic tags MUST use the `.tag` property pattern for compilation
- **Use `toTag()` function**: Create dynamic tag objects with the `toTag` utility function
- **Variable must be in scope**: The dynamic tag variable must be accessible when JSX is processed
- **Valid tag names**: Must contain valid HTML tag names or custom element names

**Best Practices:**
- Use descriptive variable names for clarity (e.g., `ActionTag`, `ElementTag`)
- Put conditional logic inside `toTag()` for cleaner code
- Consider using TypeScript for better type safety with HTML element types
- Document complex dynamic tag logic for maintainability

```tsx
// ✅ Good practices
function ActionButton({ href, children, ...props }) {
  const Tag = toTag(href ? 'a' : 'button');
  return <Tag.tag href={href} {...props}>{children}</Tag.tag>;
}

// ❌ Avoid - unnecessary separate variables for simple conditionals
function ActionButton({ href, children, ...props }) {
  const ButtonTag = toTag('button');
  const AnchorTag = toTag('a');
  const Tag = href ? AnchorTag : ButtonTag; // Extra complexity
  return <Tag.tag href={href} {...props}>{children}</Tag.tag>;
}
```

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

// Define your custom element with static tag property
export class MyButton extends LitElement {
  static tagName = 'my-button';
  static tag = toJSX(MyButton);

  render() {
    return (
      <button>
        <slot />
      </button>
    );
  }
}

// Use in JSX
<MyButton.tag>Click me</MyButton.tag>
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

// Define a custom element with typed properties and static tag
export class MyButton extends LitElement {
  static tagName = 'my-button';
  static tag = toJSX(MyButton);

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

// Use in JSX with full TypeScript support - no separate variable needed!
function renderApp() {
  return (
    <div>
      <MyButton.tag variant="primary" size="large" on-click={handleClick}>
        Click me!
      </MyButton.tag>

      <MyButton.tag
        variant="secondary"
        disabled={true}
        on-click={handleSecondaryClick}
      >
        Secondary action
      </MyButton.tag>
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
// Define once in the class with static tag property
export class MyButton extends LitElement {
  static tagName = 'my-button';
  static tag = toJSX(MyButton);
  // ... properties and methods
}

// TypeScript will provide intellisense for:
// - variant: 'primary' | 'secondary'
// - disabled: boolean
// - size: 'small' | 'medium' | 'large'
// - Standard HTML attributes (class, id, etc.)
// - Event handlers (on-click, on-change, etc.)

<MyButton.tag
  variant="primary"    // ✅ Type-safe property
  disabled={false}     // ✅ Type-safe property
  invalidProp="test"   // ❌ TypeScript error
/>
```

**Relationship to Dynamic Tag Names:**

The `toJSX` function creates Component variables that work seamlessly with jsx-lit's dynamic tag name system. **Important**: When using `toJSX` results in dynamic contexts, you must still use the `.tag` property pattern:

```tsx
// Define custom elements with static tag properties
export class MyButton extends LitElement {
  static tagName = 'my-button';
  static tag = toJSX(MyButton);
}

export class MyInput extends LitElement {
  static tagName = 'my-input';
  static tag = toJSX(MyInput);
}

// For dynamic usage, you still need .tag property access
function renderForm({ useButton }) {
  // ❌ WRONG - Direct use without .tag property
  // const SubmitComponent = useButton ? MyButton.tag : MyInput.tag;
  // return <SubmitComponent type="submit">Submit</SubmitComponent>;

  // ✅ CORRECT - Wrap in toTag for proper .tag access
  const SubmitComponent = toTag(useButton ? MyButton.tag : MyInput.tag);
  return <SubmitComponent.tag type="submit">Submit</SubmitComponent.tag>;
}
```

This compiles to:
```javascript
import { htmlStatic, __$literalMap } from 'jsx-lit';

function renderForm({ useButton }) {
  const SubmitComponent = toTag(useButton ? MyButton.tag : MyInput.tag);
  const __$SubmitComponent_tag = __$literalMap.get(SubmitComponent.tag);
  return htmlStatic`<${__$SubmitComponent_tag} type="submit">Submit</${__$SubmitComponent_tag}>`;
}
```

**Key Point**: The `.tag` property pattern is required for jsx-lit to detect and properly compile dynamic tag usage into static templates.

### The toTag Function

The `toTag` function is a utility that creates dynamic tag name objects specifically designed for jsx-lit's Component syntax with the required `.tag` property pattern.

```tsx
import { toTag } from 'jsx-lit';
```

**Function Signature:**
```tsx
function toTag<T extends keyof HTMLElementTagNameMap | (string & {})>(
  tag: T
): { tag: T; }
```

**Purpose**: Creates objects with the `.tag` property that jsx-lit requires to detect and compile dynamic tag names into static templates.

**Usage Examples:**

```tsx
import { toTag } from 'jsx-lit';

// Use in conditional rendering with required .tag property
function ConditionalElement({ condition, children }) {
  const ElementTag = toTag(condition ? 'div' : 'span');
  return <ElementTag.tag class="conditional">{children}</ElementTag.tag>;
}

// Complex dynamic tag selection
function FormField({ type, name, value }) {
  const getFieldTag = (type) => {
    switch (type) {
      case 'textarea': return 'textarea';
      case 'select': return 'select';
      default: return 'input';
    }
  };

  const FieldTag = toTag(getFieldTag(type));
  return <FieldTag.tag name={name} value={value} />;
}

// Custom elements
function CustomWidget({ type, data }) {
  const WidgetTag = toTag(`my-${type}-widget`);
  return <WidgetTag.tag data={data} />;
}
```

**Critical Requirements:**
- **Always use `.tag` property**: `<TagObject.tag>` not `<TagObject>`
- **Create with `toTag()`**: Don't use plain strings for dynamic tags
- **TypeScript support**: Provides proper typing for HTML element names

**Why This Pattern Is Required:**
jsx-lit's compiler specifically looks for the `.tag` property pattern to identify dynamic components and transform them into efficient static templates. Without this pattern, jsx-lit cannot detect dynamic tag usage and will not compile them correctly.

## How jsx-lit Works

jsx-lit uses a custom Babel transform to directly convert JSX syntax into lit-html template literals at compile time.

### Compilation Process

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

### Key Benefits

- ⚡ **Zero runtime overhead** - produces native lit-html code
- 📦 **Smaller bundle size** - no JSX runtime needed
- 🎯 **Direct integration** with lit-html ecosystem
- 🔧 **Automatic import injection** for directives
- 🎯 **Function component support** - compiles to efficient function calls

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
- Verify your `tsconfig.json` has `"jsx": "preserve"` and `"jsxImportSource": "jsx-lit"`
- Make sure you're importing from `jsx-lit/vite-jsx-preserve`

**TypeScript errors**
- Add `"jsx-lit"` to your `jsxImportSource` property in `tsconfig.json`
- Set `"jsx": "preserve"` in compiler options
- Ensure you have the latest version of TypeScript installed

**Runtime errors**
- Function components should return JSX elements, component variables should return tagNames
- Ensure custom elements are properly defined before use
- Check that event handlers use the correct `on-` syntax (not `onClick` or other React formats)
- For boolean attributes, use `as.bool()` function to get boolean attribute binding
- For DOM properties, use `as.prop()` function to get property binding instead of attribute binding

**Build errors**
- `Cannot find directive imports`: Make sure `"jsx": "preserve"` is set in tsconfig
- Babel transform errors: Check your babel configuration in the plugin options
- `Cannot resolve 'jsx-lit/jsx-runtime'`: You may be using React JSX mode - see the React JSX Runtime section

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

**Dynamic tag name issues**
- Dynamic tags not compiling to static templates: Ensure you're using the `.tag` property pattern
- `toTag` not working: Make sure to access the result with `.tag` property (`<MyTag.tag>` not `<MyTag>`)
- Runtime errors with dynamic tags: Verify `toTag()` is used to create tag objects, not plain strings
- TypeScript errors with dynamic tags: Use `toTag()` function for proper typing of HTML elements
- Static template compilation failing: Check that jsx-lit can detect `.tag` property usage in JSX

### Debugging Tips

1. **Check compiled output**: Use browser dev tools to see the actual generated code
2. **Use source maps**: Both modes support source maps for debugging
3. **Verify binding syntax**: Check that attributes compile to the expected lit-html binding syntax (`.`, `?`, `@`, etc.)
4. **Test directive imports**: Ensure required lit-html directives are properly imported
5. **Function component debugging**: Check that function components are called with correct props objects in compiled output
6. **Dynamic tag debugging**: Verify `.tag` property usage compiles to `__$literalMap.get()` calls in output
7. **Static template verification**: Check that dynamic tags use `htmlStatic` instead of regular `html` templates

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

## React JSX Runtime Mode (Alternative)

jsx-lit also supports a React JSX runtime mode for easier migration from React projects.

### Setup

```typescript
// vite.config.ts
import { litJsx } from 'jsx-lit/vite-jsx-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [litJsx()],
});
```

### TypeScript Configuration

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

### How React JSX Runtime Mode Works

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

### When to Use React JSX Runtime Mode

**Choose React JSX Runtime (`vite-jsx-react`) when:**
- You need gradual migration from React projects
- You prefer React-style JSX transformation
- You're prototyping or in development phase

**Choose Custom Compiler (`vite-jsx-preserve`) when:**
- Performance is critical (production apps)
- Bundle size matters
- You want the most efficient lit-html integration
- Starting a new project with jsx-lit
- You want to use function components (full support)

### Comparison: Custom Compiler vs React JSX Runtime

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

---

Made with ❤️ for the Lit community
