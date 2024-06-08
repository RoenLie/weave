import { FlatConfig } from 'typescript-eslint';


declare const configs: {
	base: FlatConfig.ConfigArray,
	node: FlatConfig.ConfigArray,
	lit: FlatConfig.ConfigArray,
	all: FlatConfig.ConfigArray,
} = {
	base,
	node,
	lit,
	all
}


export default configs;