import { beforeEach, describe, expect, it } from 'vitest';

import { pluginData } from '../src/data-structures.js';
import { PluginModule } from '../src/plugin/plugin.js';
import { PluginBundler } from '../src/plugin/plugin-bundler.js';
import { PluginLoader } from '../src/plugin/plugin-loader.js';
import { AppHost } from '../src/setup/app-host.js';
import { applicationSetup, locationMapper, pluginScope } from './mocks/plugin-setup.js';


const createLoader = () => {
	AppHost.defineLayers(applicationSetup.layers);
	AppHost.defineScopes(pluginScope, connector => {
		connector.connect('default', { locationMapper });
	});

	const loader = new PluginLoader('default');

	return loader;
};
const createBundler = () => new PluginBundler();


let loader = createLoader();
let bundler = createBundler();

beforeEach(()=> {
	loader = createLoader();
	bundler = createBundler();
});

describe('Basic useage test', () => {
	it('Load one container-module, retrieve the constant value from the connected id', async () => {
		const module = new PluginModule(({ bind }) => {
			bind('IConstantValue').toConstantValue(10);
		});

		const bundle = bundler.bundle(
			() => [ 'SYS', 'CORP', 'DEFAULT' ],
			{ module: async () => module },
		);

		bundle().connect(pluginData);

		const container = await loader.load();
		const constantValue = container.get('IConstantValue');

		expect(constantValue).toBe(10);
	});
});
