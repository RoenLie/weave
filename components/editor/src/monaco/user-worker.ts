import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';


export const setUserWorker = (() => {
	let initialized = false;

	const fn = () => {
		if (initialized)
			return;

		initialized = true;
		self.MonacoEnvironment = {
			async getWorker(_: unknown, label: string) {
				if (label === 'json')
					return import('monaco-editor/esm/vs/language/json/json.worker?worker&inline').then(w => new w.default());

				if (label === 'css' || label === 'scss' || label === 'less')
					return import('monaco-editor/esm/vs/language/css/css.worker?worker&inline').then(w => new w.default());

				if (label === 'html' || label === 'handlebars' || label === 'razor')
					return import('monaco-editor/esm/vs/language/html/html.worker?worker&inline').then(w => new w.default());

				if (label === 'typescript' || label === 'javascript')
					return import('monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline').then(w => new w.default());

				return import('monaco-editor/esm/vs/editor/editor.worker?worker&inline').then(w => new w.default());
			},
		};

		const ts = monaco.languages.typescript;
		ts.typescriptDefaults.setEagerModelSync(true);
		ts.typescriptDefaults.setCompilerOptions({
			...ts.typescriptDefaults.getCompilerOptions(),
			experimentalDecorators:             true,
			target:                             ts.ScriptTarget.ESNext,
			module:                             ts.ModuleKind.ESNext,
			moduleResolution:                   ts.ModuleResolutionKind.Classic,
			pretty:                             true,
			strict:                             true,
			noUncheckedIndexedAccess:           true,
			noPropertyAccessFromIndexSignature: true,
			strictPropertyInitialization:       false,
			forceConsistentCasingInFileNames:   true,
			allowSyntheticDefaultImports:       true,
			noImplicitOverride:                 true,
			useDefineForClassFields:            false,
			noEmitOnError:                      true,
			incremental:                        false,
			verbatimModuleSyntax:               true,
			esModuleInterop:                    true,
			skipLibCheck:                       true,
			resolveJsonModule:                  true,
			noUnusedLocals:                     false,
			noUnusedParameters:                 false,
			noFallthroughCasesInSwitch:         true,
			strictNullChecks:                   true,
			emitDecoratorMetadata:              true,
			noImplicitReturns:                  false,
			noImplicitAny:                      true,
			noImplicitThis:                     true,
			isolatedModules:                    true,
		});
	};

	fn();

	return fn;
})();
