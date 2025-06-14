# Changelog

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
- **Dynamic Tag Names**: Enhanced support for conditional and polymorphic element types
- **Error Handling**: Better error messages and validation during compilation
- **Type Safety**: Improved TypeScript definitions and JSX type support

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
- Dynamic tag names and component variables
- Custom element integration with `toJSX()` function
