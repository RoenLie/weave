import type { Config } from 'typescript-eslint';


declare const configs: {
	base: Config,
	node: Config,
	lit:  Config,
	all:  Config,
} = {
	base,
	node,
	lit,
	all,
};


export default configs;
