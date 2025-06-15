# jsx-lit

A powerful JSX compiler and Vite plugin that transforms JSX into native Lit templates at compile time with zero runtime overhead.

## 🚀 Features

jsx-lit brings the familiar JSX syntax to the Lit ecosystem while maintaining the performance and capabilities that make Lit exceptional.

```tsx
// Write familiar JSX
function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <div classList={{ completed: todo.completed }}>
      <input
        type="checkbox"
        checked={as.prop(todo.completed)}
        disabled={as.bool(todo.readonly)}
        on-change={() => onToggle(todo.id)}
      />
      <span>{todo.text}</span>
      <button on-click={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
}

// Compiles to efficient Lit templates
html`
  <div class=${classMap({ completed: todo.completed })}>
    <input
      type="checkbox"
      .checked=${todo.completed}
      ?disabled=${todo.readonly}
      @change=${() => onToggle(todo.id)}
    />
    <span>${todo.text}</span>
    <button @click=${() => onDelete(todo.id)}>Delete</button>
  </div>
`
```

### ✨ Key Benefits

- **⚡ Zero Runtime Overhead**: Pure compile-time transformation to native Lit templates
- **🎯 Type-Safe**: Full TypeScript support with comprehensive JSX type definitions
- **🔧 Vite Integration**: Seamless setup with the included Vite plugin
- **🎨 Lit Ecosystem**: Works with all Lit directives, custom elements, and patterns
- **🎛️ Flexible Binding**: Fine-grained control over attribute, property, and boolean bindings
- **🏷️ Dynamic Tags**: Support for conditional element types with static template optimization
- **📦 Function Components**: Full support for composable function components
- **🔗 Custom Elements**: Type-safe integration with Lit-based custom elements
- **🧩 Library Components**: Built-in `For`, `Show`, and `Choose` components for common rendering patterns

## 📦 Installation

```bash
npm install jsx-lit
# or
pnpm add jsx-lit
# or
yarn add jsx-lit
```

## ⚡ Quick Start

### 1. Configure Vite

```typescript
// vite.config.ts
import { litJsx } from 'jsx-lit/vite-jsx-preserve';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [litJsx()],
});
```

### 2. Configure TypeScript

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "jsx-lit"
  }
}
```

### 3. Start Writing JSX

```tsx
import { LitElement } from 'lit';
import { For, Show, Choose } from 'jsx-lit';

export class MyComponent extends LitElement {
  render() {
    return (
      <div>
        <h1>Hello jsx-lit!</h1>
        <p>JSX compiled to Lit templates with utility components</p>

        <Show when={this.items.length > 0}>
          {(length) => (
            <For each={this.items}>
              {(item, index) => <div>{item}</div>}
            </For>
          )}
        </Show>
      </div>
    );
  }
}
```

## 🎯 Core Concepts

### Attribute Binding Control

jsx-lit provides precise control over how values are bound to elements:

#### Default Behavior (Attribute Binding)
```tsx
<input value={userInput} />
// Compiles to: <input value=${userInput} />
```

#### Property Binding
```tsx
<input value={as.prop(userInput)} />
// or
<input value={prop => userInput} />
// Compiles to: <input .value=${userInput} />
```

#### Boolean Attribute Binding
```tsx
<input disabled={as.bool(isDisabled)} />
// or
<input disabled={bool => isDisabled} />
// Compiles to: <input ?disabled=${isDisabled} />
```

### Special Attributes

#### classList - Object to Class Mapping
```tsx
<div classList={{ active: isActive, disabled: !isEnabled }}>
// Compiles to: <div class=${classMap({ active: isActive, disabled: !isEnabled })}>
```

#### styleList - Object to Style Mapping
```tsx
<div styleList={{ color: textColor, fontSize: '16px' }}>
// Compiles to: <div style=${styleMap({ color: textColor, fontSize: '16px' })}>
```

#### Event Handlers
```tsx
<button on-click={handleClick} on-dblclick={handleDoubleClick}>
// Compiles to: <button @click=${handleClick} @dblclick=${handleDoubleClick}>
```

#### References
```tsx
<input ref={inputRef} />
// Compiles to: <input ${ref(inputRef)} />
```

#### Element Directives
```tsx
<div directive={myDirective()} />
// Compiles to: <div ${myDirective()} />

// Multiple directives as an array
<div directive={[directive1(), directive2()]} />
// Compiles to: <div ${directive1()} ${directive2()} />
```

#### Spread Attributes
```tsx
<div {...dynamicProps} />
// Compiles to: <div ${__$rest(dynamicProps)} />
```

## 🏗️ Component Patterns

### Function Components

jsx-lit fully supports function components that return JSX:

```tsx
const Button = ({ label, variant = 'primary', disabled, onClick, children }) => (
  <button
    classList={{ [`btn-${variant}`]: true, 'disabled': disabled }}
    disabled={as.bool(disabled)}
    on-click={onClick}
  >
    {label || children}
  </button>
);

// Usage
<Button
  label="Submit"
  variant="success"
  onClick={handleSubmit}
  disabled={isLoading}
/>
```

Function components:
- Receive props as a single object parameter
- Support `children` via the `children` property
- Compile to efficient function calls
- Support all JSX features including conditional rendering and loops

### Custom Element Integration

Use `toJSX()` for type-safe custom element components:

```tsx
import { toJSX } from 'jsx-lit';
import { LitElement } from 'lit';

export class MyButton extends LitElement {
  static tagName = 'my-button';
  static tag = toJSX(MyButton);

  render() {
    return html`<button><slot></slot></button>`;
  }
}

// Usage with type safety
<MyButton.tag
  class="custom-btn"
  onClick={() => console.log('Clicked!')}
/>
```

#### Generic Custom Elements

For custom elements with generic types, you can create type-safe JSX components using explicit type casting:

```tsx
import { toJSX } from 'jsx-lit';
import { LitElement } from 'lit';

class DataList<T> extends LitElement {
  static tagName = 'data-list';
  // Type casting is required due to TypeScript's inability to forward generics
  static tag = toJSX(this) as <T>(props: JSX.JSXProps<DataList<T>>) => JSX.JSXElement;

  @property({ type: Array }) items: T[] = [];
  @property() renderItem?: (item: T) => TemplateResult;

  render() {
    return html`
      <ul>
        ${this.items.map(item => html`
          <li>${this.renderItem ? this.renderItem(item) : item}</li>
        `)}
      </ul>
    `;
  }
}

// Usage with explicit type parameter
<DataList.tag<User>
  items={users}
  renderItem={(user) => `${user.name} (${user.email})`}
/>

// Type inference works for the renderItem callback
<DataList.tag<Product>
  items={products}
  renderItem={(product) => `${product.name} - $${product.price}`}
/>
```

**Note**: The current generic syntax requires explicit type casting due to TypeScript's limitations in forwarding generic parameters through static properties. If TypeScript gains the ability to forward generics in this context in the future, jsx-lit will implement a more seamless syntax.

### Dynamic Tag Names

jsx-lit supports dynamic element types with the `.tag` property pattern:

```tsx
import { toTag } from 'jsx-lit';

function ActionElement({ href, children }) {
  const Tag = toTag(href ? 'a' : 'button');

  return (
    <Tag.tag href={href} class="action-element">
      {children}
    </Tag.tag>
  );
}
```

**Important**: Dynamic tag names must use the `.tag` property pattern for proper static template compilation.

### Library Components

jsx-lit provides utility components that enhance common patterns and integrate seamlessly with Lit directives:

#### For Component - Declarative List Rendering

The `For` component provides a declarative way to render lists with optional keys and separators:

```tsx
import { For } from 'jsx-lit';

// Basic list rendering
<For each={users}>
  {(user, index) => (
    <div class="user-item">
      {index + 1}. {user.name}
    </div>
  )}
</For>

// With key function for efficient updates
<For each={todos} key={(todo) => todo.id}>
  {(todo, index) => (
    <li classList={{ completed: todo.completed }}>
      {todo.text}
    </li>
  )}
</For>

// With separators between items
<For each={breadcrumbs} separator={<span> / </span>}>
  {(crumb, index) => (
    <a href={crumb.url}>{crumb.label}</a>
  )}
</For>
```

The `For` component automatically uses lit-html's optimized directives:
- **Without key**: Uses `map` directive for simple iteration
- **With key**: Uses `repeat` directive for efficient updates when items change
- **With separator**: Uses `join` directive to insert elements between items

#### Show Component - Conditional Rendering

The `Show` component provides type-safe conditional rendering with optional fallback:

```tsx
import { Show } from 'jsx-lit';

// Simple conditional rendering
<Show when={user}>
  {(user) => (
    <div class="welcome">
      Welcome back, {user.name}!
    </div>
  )}
</Show>

// With fallback content
<Show when={currentUser}>
  {[
    (user) => (
      <div class="user-panel">
        <img src={user.avatar} alt={user.name} />
        <span>{user.name}</span>
      </div>
    ),
    () => (
      <div class="login-prompt">
        <button>Sign In</button>
      </div>
    )
  ]}
</Show>

// Conditional rendering with complex conditions
<Show when={items.length > 0}>
  {(length) => (
    <div class="item-count">
      Found {length} items
    </div>
  )}
</Show>
```

The `Show` component uses lit-html's `when` directive internally and provides strong TypeScript inference for the truthy value.

#### Choose Component - Multi-Condition Rendering

The `Choose` component enables clean switch-like conditional rendering with multiple condition-output pairs:

```tsx
import { Choose } from 'jsx-lit';

// Multiple conditions based on a value
<Choose value={status}>
  {[
    (status) => status === 'loading',
    () => (
      <div class="loading">
        <spinner-icon></spinner-icon>
        Loading...
      </div>
    )
  ]}
  {[
    (status) => status === 'error',
    (status) => (
      <div class="error">
        Error: {status}
      </div>
    )
  ]}
  {[
    (status) => status === 'success',
    (status) => (
      <div class="success">
        Operation completed successfully!
      </div>
    )
  ]}
  {[
    () => true, // Default case
    (status) => (
      <div class="unknown">
        Unknown status: {status}
      </div>
    )
  ]}
</Choose>

// Without a value (boolean conditions)
<Choose>
  {[
    () => user.isAdmin,
    () => <admin-panel></admin-panel>
  ]}
  {[
    () => user.isModerator,
    () => <moderator-panel></moderator-panel>
  ]}
  {[
    () => true, // Default case
    () => <user-panel></user-panel>
  ]}
</Choose>
```

The `Choose` component evaluates conditions in order and renders the first matching case, similar to a switch statement but as an expression.

#### Combining Library Components

These components work seamlessly together for complex rendering scenarios:

```tsx
import { For, Show, Choose } from 'jsx-lit';

@customElement('user-dashboard')
export class UserDashboard extends LitElement {
  @property({ type: Array }) users = [];
  @property() currentUser = null;
  @property() viewMode = 'list';

  render() {
    return (
      <div class="dashboard">
        {/* Conditional user greeting */}
        <Show when={this.currentUser}>
          {(user) => (
            <header class="welcome">
              Welcome back, {user.name}!
            </header>
          )}
        </Show>

        {/* Dynamic view rendering based on mode */}
        <Choose value={this.viewMode}>
          {[
            (mode) => mode === 'grid',
            () => (
              <div class="user-grid">
                <For each={this.users} key={(user) => user.id}>
                  {(user) => (
                    <div class="user-card">
                      <img src={user.avatar} alt={user.name} />
                      <h3>{user.name}</h3>
                      <p>{user.role}</p>
                    </div>
                  )}
                </For>
              </div>
            )
          ]}
          {[
            (mode) => mode === 'list',
            () => (
              <div class="user-list">
                <For each={this.users} separator={<hr />}>
                  {(user, index) => (
                    <div class="user-row">
                      <span class="user-index">{index + 1}.</span>
                      <span class="user-name">{user.name}</span>
                      <span class="user-role">{user.role}</span>
                    </div>
                  )}
                </For>
              </div>
            )
          ]}
          {[
            () => true, // Default case
            (mode) => (
              <div class="error">
                Unknown view mode: {mode}
              </div>
            )
          ]}
        </Choose>

        {/* Conditional empty state */}
        <Show when={this.users.length === 0}>
          {() => (
            <div class="empty-state">
              <p>No users found</p>
              <button on-click={this.loadUsers}>Load Users</button>
            </div>
          )}
        </Show>
      </div>
    );
  }
}
```

## 🔧 Advanced Usage

### Lit Directives Integration

jsx-lit works seamlessly with all Lit directives:

```tsx
import { when } from 'lit-html/directives/when.js';
import { repeat } from 'lit-html/directives/repeat.js';
import { guard } from 'lit-html/directives/guard.js';

return (
  <div>
    {when(condition, () => <p>Conditional content</p>)}
    {repeat(items, item => item.id, item => (
      <li key={item.id}>{item.name}</li>
    ))}
    {guard([expensiveData], () => (
      <ExpensiveComponent data={expensiveData} />
    ))}
  </div>
);
```

### Complex Example: Todo List

```tsx
@customElement('todo-list')
export class TodoList extends LitElement {
  @property({ type: Array }) items = [];
  @state() private newItemText = '';
  @state() private filter = 'all';

  private inputRef = createRef();

  get filteredItems() {
    switch (this.filter) {
      case 'active': return this.items.filter(item => !item.completed);
      case 'completed': return this.items.filter(item => item.completed);
      default: return this.items;
    }
  }

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

  render() {
    return (
      <div class="todo-container">
        <h1>Todo List</h1>

        <div class="add-form">
          <input
            ref={this.inputRef}
            value={as.prop(this.newItemText)}
            placeholder="Add new todo..."
            on-input={(e) => this.newItemText = e.target.value}
            on-keydown={(e) => e.key === 'Enter' && this.addItem()}
          />
          <button on-click={this.addItem}>Add</button>
        </div>

        <div class="filters">
          {['all', 'active', 'completed'].map(filterType => (
            <button
              classList={{ active: this.filter === filterType }}
              on-click={() => this.filter = filterType}
            >
              {filterType}
            </button>
          ))}
        </div>

        {when(this.filteredItems.length > 0, () => (
          <ul class="todo-list">
            {repeat(this.filteredItems, item => item.id, item => (
              <TodoItem
                todo={item}
                onToggle={(id) => this.toggleItem(id)}
                onDelete={(id) => this.deleteItem(id)}
              />
            ))}
          </ul>
        ), () => (
          <p class="empty-state">No items to show</p>
        ))}
      </div>
    );
  }
}
```

## 🎛️ Configuration

### Vite Plugin Options

```typescript
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

## 🚀 Template Types

jsx-lit automatically detects and uses the appropriate template type:

- **HTML templates**: `html\`...\`` for regular HTML elements
- **SVG templates**: `svg\`...\`` for SVG elements
- **MathML templates**: `mathml\`...\`` for MathML elements
- **Static templates**: `htmlStatic\`...\`` for dynamic tag names

## 🎯 Best Practices

### When to Use Each Binding Type

**Attribute Binding (Default)**
- Custom attributes and data attributes
- Values that should appear in HTML as attributes
- Working with libraries that expect attributes

```tsx
<div data-id={item.id} aria-label={item.description} />
```

**Property Binding (`as.prop()` or `prop =>`)**
- Standard DOM properties like `value`, `checked`, `selected`
- Interactive elements that need live property updates
- Complex object values

```tsx
<input value={as.prop(formData.email)} checked={as.prop(isSelected)} />
```

**Boolean Attribute Binding (`as.bool()` or `bool =>`)**
- Boolean HTML attributes like `disabled`, `hidden`, `readonly`
- Accessibility attributes that follow boolean patterns
- Presence/absence semantics

```tsx
<button disabled={as.bool(isLoading)} hidden={as.bool(!isVisible)} />
```

### Function Component Guidelines

- Use descriptive prop names and provide defaults where appropriate
- Keep components focused and composable
- Leverage TypeScript for better developer experience
- Handle `children` appropriately for flexible composition

### Dynamic Tag Best Practices

- Always use `toTag()` with the `.tag` property pattern
- Use descriptive variable names for clarity
- Consider TypeScript for better type safety with HTML elements
- Document complex dynamic tag logic

## 🔗 Ecosystem Integration

jsx-lit is designed to work seamlessly with the entire Lit ecosystem:

- **Lit Elements**: Full compatibility with LitElement and reactive properties
- **Lit Directives**: All official and community directives work out of the box
- **Custom Elements**: Easy integration with any custom elements
- **Web Components**: Standard web component patterns and lifecycle
- **TypeScript**: Comprehensive type definitions for the best developer experience

## 📚 Migration Guide

### From React JSX

jsx-lit syntax is very similar to React, with a few key differences:

```tsx
// React
<button onClick={handler} className="btn" />

// jsx-lit
<button on-click={handler} class="btn" />
```

### From Lit html Templates

```tsx
// Lit html
html`<div class=${classMap(classes)}>${content}</div>`

// jsx-lit
<div classList={classes}>{content}</div>
```

## 🤝 Contributing

jsx-lit is part of the larger Weave project. Contributions are welcome!

## 📄 License

Apache-2.0
