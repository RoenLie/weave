# Reflect-Metadata

Partial implementation of TC39 reflect-metadata.
Primarily for use as a lightweight and function activated implementation shim to the proposal.

### Manual activation
#### .ts/.js
```typescript 
import { useReflectMetadata } from '@roenlie/reflect-metadata';

useReflectMetadata();
```
#### .html
```html
<script type="module">
	import { useReflectMetadata } from '@roenlie/reflect-metadata';

	useReflectMetadata();
</script>
```

### Automatic activation
#### .ts/.js
```typescript
import '@roenlie/reflect-metadata/use';
```
#### .html
```html
<script type="module" src="@roenlie/reflect-metadata/use"></script>
```


Repeated calls to `useReflectMetadata` will have no effect.
If any of the methods being shimmed already exists from a different reflect-metadata shim, existing implementation will not be overriden.

Approximately 3.2kb not-minified, 1.70kb minified, 0.70kb gzipped.