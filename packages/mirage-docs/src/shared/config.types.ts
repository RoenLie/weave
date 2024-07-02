interface SrcTag {
	src: string;
	order?: number | 'pre' | 'post';
}


type DeepPartial<T extends Record<keyof any, any>> = {
	[P in keyof T]?: T[P] extends Record<keyof any, any> ? DeepPartial<T[P]> : T[P];
};


export interface SiteConfig {
	root: {
		styleImports: SrcTag[];
		scriptImports: SrcTag[];
		layout: {
			logoSrc: string;
			logoHeight: string;
			headingText: string;
		};
		sidebar: {
			nameReplacements: [from: string, to: string][];
			delimiter: string;
		};
		styleOverrides: {
			layout: string;
			sidebar: string;
			pathTree: string;
			metadata: string;
			cmpEditor: string;
			pageHeader: string;
			sourceEditor: string;
			pageTemplate: string;
		},
	},
	pages: {
		styles: SrcTag[];
		scripts: SrcTag[];
		darkTheme: string;
		lightTheme: string;
	}
	env: {
		base: string;
		libDir: string;
		rootDir: string;
		entryDir: string;
	}
}


export type UserSiteConfig = Omit<DeepPartial<SiteConfig>, 'env'>;
