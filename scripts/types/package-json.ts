export interface Address {
	email?: string;
	url?:   string;
}
export interface Person extends Address {
	name: string;
}
export interface PackageJson {
	name:          string;
	version:       string;
	description?:  string;
	keywords?:     string;
	homepage?:     string;
	bugs?:         Address;
	license?:      string;
	author?:       string | Person;
	contributors?: string[] | Person[];
	files?:        string[];
	main?:         string;
	browser?:      string;
	bin?:          Record<string, string>;
	man?:          string;
	directories?: {
		lib?:     string;
		bin?:     string;
		man?:     string;
		doc?:     string;
		example?: string;
		test?:    string;
	};
	repository?: {
		type?:      'git';
		url?:       string;
		directory?: string;
	};
	scripts?:              Record<string, string>;
	config?:               Record<string, string>;
	dependencies?:         Record<string, string>;
	devDependencies?:      Record<string, string>;
	peerDependencies?:     Record<string, string>;
	optionalDependencies?: Record<string, string>;
	bundledDependencies?:  string[];
	engines?:              Record<string, string>;
	os?:                   string[];
	cpu?:                  string[];
}
