interface SrcTag {
	src:    string;
	order?: number | 'pre' | 'post';
}


type DeepPartial<T extends Record<keyof any, any>> = {
	[P in keyof T]?: T[P] extends Record<keyof any, any> ? DeepPartial<T[P]> : T[P];
};


export interface SiteConfig {
	root: {
		darkTheme:     string[];
		lightTheme:    string[];
		styleImports:  SrcTag[];
		scriptImports: SrcTag[];
		layout: {
			logoSrc:          string;
			logoHeight:       string;
			headingText:      string;
			clearLogOnReload: boolean;
		};
		sidebar: {
			nameReplacements: [from: string | RegExp, to: string][];
			groupingKey:      string;
		};
		styleOverrides: {
			layout:       string;
			sidebar:      string;
			pathTree:     string;
			metadata:     string;
			cmpEditor:    string;
			pageHeader:   string;
			sourceEditor: string;
			pageTemplate: string;
		},
	},
	pages: {
		styles:     SrcTag[];
		scripts:    SrcTag[];
		darkTheme:  string[];
		lightTheme: string[];
	}
	env: {
		base:     string;
		libDir:   string;
		rootDir:  string;
		entryDir: string;
	}
}


export type UserSiteConfig = Omit<DeepPartial<SiteConfig>, 'env'>;
