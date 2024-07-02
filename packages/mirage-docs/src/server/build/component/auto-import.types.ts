import { type ResolvedConfig } from 'vite';


export interface AutoImportPluginProps {
	tagPrefixes: string[],
	loadWhitelist: RegExp[],
	loadBlacklist?: RegExp[];
	tagCaptureExpr?: RegExp;
}


export interface AutoImportLoadProps {
	id: string;
	config: ResolvedConfig;
	tagCache: Map<string, string>;
	tagPrefixes: string[];
	loadWhitelist: RegExp[];
	loadBlacklist?: RegExp[];
	tagCaptureExpr?: RegExp;
}
