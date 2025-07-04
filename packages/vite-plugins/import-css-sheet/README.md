# @roenlie/vite-plugin-import-css-sheet
Small plugin that enables the use of tc39/proposal-import-attributes for css files in vite.
Any imported .css file that uses the with/assert syntax will be imported as a `CSSStyleSheet`.
This plugin **only** covers .css imports and nothing else.


## Install

#### npm
```
npm i @roenlie/vite-plugin-import-css-sheet --save-dev
```

#### pnpm
```
pnpm add -D @roenlie/vite-plugin-import-css-sheet
```

## Enable
```typescript
import { defineConfig } from 'vite';
import { importCSSSheet } from '@roenlie/vite-plugin-import-css-sheet';

export default defineConfig({
	plugins: [
		importCSSSheet(),
	],
});
```

For typings to work correctly, in your tsconfig.json file add the following:

#### tsconfig.json
```json
{
	"compilerOptions": {
		"types": [
			"@roenlie/vite-plugin-import-css-sheet/client"
		]
	},
}
```
This adds the correct type to .css file imports.

If you also use vite/client typings, `@roenlie/vite-plugin-import-css-sheet/client` must be below it.

## Usage

New correct syntax.
```typescript
import style from './button.css' with { type: 'css' };
```

Also works with the previous assert syntax.
```typescript
import style from './button.css' assert { type: 'css' };
```
<br><br>
