import ts from 'typescript';
import type { CodeModule } from '../api/code.controller.ts';


export const tsCache = new Map<string, string>();


export const createCacheSlug = (data: Pick<CodeModule, 'tenant' | 'domain' | 'subdomain' | 'path'>) =>
	data.tenant + '|' + data.domain + '|' + data.subdomain + '|' + data.path;


export const handleTypescript = async (path: string, content: string): Promise<string> => {
	if (!tsCache.has(path)) {
		const code = ts.transpile(content, {
			target:                  ts.ScriptTarget.ESNext,
			module:                  ts.ModuleKind.ESNext,
			moduleResolution:        ts.ModuleResolutionKind.Bundler,
			importHelpers:           false,
			experimentalDecorators:  true,
			emitDecoratorMetadata:   true,
			useDefineForClassFields: false,
		});

		tsCache.set(path, code);
	}

	return tsCache.get(path)!;
};
