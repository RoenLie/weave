import eslintConfig from '@roenlie/eslint-config';
import tseslint from 'typescript-eslint';

export default [
	...eslintConfig.all,
	...tseslint.config({
		ignores: [ '**/dist/**' ],
	}),
];
