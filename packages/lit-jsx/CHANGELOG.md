# Changelog
...
All notable changes to jsx-lit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project tries to adhere with [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-06-14

### Added
- **Function Components Support**: Full support for JSX function components that return JSX
  - Function components are compiled to efficient call expressions with props objects
  - Children are automatically passed via the `children` property in props
  - Support for multiple children (passed as arrays) and single children (passed directly)
  - Zero runtime overhead with compile-time transformation

- **`toTag()` Utility Function**: New utility for creating dynamic tag name objects
  - Required for dynamic tag names to compile to static templates
  - Creates objects with `.tag` property that jsx-lit detects for compilation
  - Provides TypeScript support for HTML element tag names
  - Essential for proper dynamic tag usage: `const Tag = toTag('div'); <Tag.tag>Content</Tag.tag>`

- **Library Components**: Utility components for common rendering patterns
  - **`For` Component**: Declarative list rendering with optional keys and separators
    - Automatically uses `map`, `repeat`, or `join` directives based on props
    - `<For each={items} key={item => item.id}>{(item, index) => <div>{item}</div>}</For>`
    - Supports separators: `<For each={items} separator={<hr />}>{...}</For>`
  - **`Show` Component**: Type-safe conditional rendering with optional fallback
    - Uses lit-html's `when` directive with strong TypeScript inference
    - `<Show when={user}>{(user) => <div>Welcome {user.name}!</div>}</Show>`
    - Supports fallback: `<Show when={condition}>{trueCase} {falseCase}</Show>`
  - **`Choose` Component**: Multi-condition rendering similar to switch statements
    - Evaluates condition-output pairs in order, renders first match
    - `<Choose value={status}>{[condition, output]} {[condition2, output2]}</Choose>`
    - Supports default cases and complex conditional logic

### Changed
- **Attribute Binding Default**: Expressions in JSX attributes now bind as HTML attributes by default instead of properties
  - `<input value={value} />` now compiles to `value=${value}` (attribute binding)
  - Use `as.prop` to force property binding: `<input value={as.prop(value)} />`
  - Use `as.bool` to force boolean attribute binding: `<button disabled={as.bool(flag)} />`
  - Alternative syntax: `<input value={prop => value} />` or `<button disabled={bool => flag} />`

- **Enhanced Binding Control**: Improved binding control functions for more precise control
  - Better TypeScript integration and error messages
  - More consistent compilation output

- **Custom Element Integration**: Improved `toJSX()` function for better type safety
  - Enhanced TypeScript intellisense and type checking
  - Better integration with dynamic tag name features

### Enhanced
- **Dynamic Tag Names**: Enhanced support for conditional and polymorphic element types with **required `.tag` property pattern**
- **Error Handling**: Better error messages and validation during compilation
- **Type Safety**: Improved TypeScript definitions and JSX type support
- **New `toTag()` Utility**: Function to create dynamic tag objects with proper `.tag` property structure

### Critical Breaking Change: Dynamic Tag Names

**IMPORTANT**: Dynamic tag names now require the `.tag` property pattern for proper compilation to static templates.

```tsx
// ❌ OLD WAY - No longer works correctly
const Tag = condition ? 'div' : 'span';
return <Tag>Content</Tag>; // Won't compile to static templates

// ✅ NEW WAY - Required .tag property pattern
import { toTag } from 'jsx-lit';

const Tag = toTag(condition ? 'div' : 'span');
return <Tag.tag>Content</Tag.tag>; // Compiles to efficient static templates
```

**Why This Change**: jsx-lit's compiler specifically looks for the `.tag` property pattern to detect and transform dynamic tags into efficient lit-html static templates. This pattern ensures optimal performance and proper compilation.

### Migration Guide for Dynamic Tags

If you were using dynamic tag names in previous versions, you need to update your code:

```tsx
// ❌ Before v1.1.0
const ElementType = condition ? 'div' : 'span';
return <ElementType>Content</ElementType>;

// ✅ After v1.1.0 - Required pattern for proper compilation
import { toTag } from 'jsx-lit';

const ElementType = toTag(condition ? 'div' : 'span');
return <ElementType.tag>Content</ElementType.tag>;
```

**Custom Elements with Dynamic Usage**:
```tsx
// ❌ Before - External variable creation
import { toJSX } from 'jsx-lit';
const Button = toJSX(MyButton);

// ✅ After - Static property in class + toTag for dynamic usage
export class MyButton extends LitElement {
  static tagName = 'my-button';
  static tag = toJSX(MyButton);
}

// For dynamic usage
const ButtonTag = toTag(MyButton.tag);
const InputTag = toTag(MyInput.tag);
const Component = useButton ? ButtonTag : InputTag;
return <Component.tag>Content</Component.tag>;
```

### Examples

**Function Components (New)**:
```tsx
// Before: Not supported
const MyButton = () => <button>Click me</button>;
<MyButton /> // ❌ Error

// After: Full support
const MyButton = ({ label, onClick }) => (
  <button on-click={onClick}>{label}</button>
);
<MyButton label="Click me" onClick={handler} /> // ✅ Works

// Compiles to:
html`${MyButton({ label: "Click me", onClick: handler })}`
```

**Library Components (New)**:
```tsx
// For component - List rendering
<For each={items} key={(item) => item.id} separator={<hr />}>
  {(item, index) => <div>{item.name}</div>}
</For>

// Show component - Conditional rendering
<Show when={user}>
  {(user) => <div>Welcome {user.name}!</div>}
</Show>

// Choose component - Multi-condition rendering
<Choose value={status}>
  {[
    (status) => status === 'loading',
    () => <div>Loading...</div>
  ]}
  {[
    (status) => status === 'error',
    (status) => <div>Error: {status}</div>
  ]}
</Choose>
```

**Property Binding (Changed)**:
```tsx
// Before: Property binding by default
<input value={value} /> // → .value=${value}

// After: Attribute binding by default
<input value={value} /> // → value=${value}

// Use as.prop for property binding
<input value={as.prop(value)} /> // → .value=${value}

// Alternative syntax
<input value={prop => value} /> // → .value=${value}
```

## [1.0.4] - Previous Release

### Features
- Custom JSX compiler with zero runtime overhead
- React JSX runtime support for easier migration
- Vite plugin integration
- TypeScript support with full type safety
- Lit directive integration (classMap, styleMap, ref, etc.)
- Event handler transformation (`on-*` to `@*`)
- Spread syntax support
- Dynamic tag names with **required `.tag` property pattern** and `toTag()` utility
- Custom element integration with `toJSX()` function and static `.tag` properties
