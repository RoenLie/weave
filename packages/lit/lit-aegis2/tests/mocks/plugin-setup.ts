import { type LocationMapper } from '../../src/app.types.js';
import { PluginBundler } from '../../src/plugin/plugin-bundler.js';
import { PluginLoader } from '../../src/plugin/plugin-loader.js';


export type ModuleLocation = readonly [
	layer: RecursiveKeyof<typeof layer>,
	code: string,
	module: RecursiveKeyof<typeof module>
];

export const layer = {
	SYS: {
		SAM: {
			INT: {
				CUS: {},
			},
		},
	},
};

export const code = {
	CORP: {
		ESS: {
			ESN: {},
		},
		ESI: {},
	},
};

export const module = {
	DEFAULT: {
		APPROVAL: {
			ACCOUNTING: {
				EXPENSE:       {},
				GENERALLEDGER: {},
				INVOICE:       {
					COSTINVOICE:   {},
					PURCHASEORDER: {},
					REMINDER:      {},
				},
				TRAVEL:            {},
				PAYMENTFILE:       {},
				PURCHASE:          {},
				ORDERCONFIRMATION: {},
				CASHCALL:          {},
				BILLING:           {},
			},
			AFE:      {},
			CONTRACT: {},
		},
		DELIVERYNOTE:       {},
		CUSTOMSDECLARATION: {},
		ARCHIVE:            {},
	},
};

export const applicationSetup: {
	layers: Record<string, RecursiveRecord>;
} = {
	layers: { layer, code, module },
};

export const locationMapper: LocationMapper = () => {
	const code = 'ESN', module = 'INVOICE';

	return {
		from: [ 'layer', 'code', 'module' ],
		to:   [ 'CUS', code, module ],
	};
};

export const pluginScope = { default: {} };

export const createPluginBundler = () => new PluginBundler();

export const createPluginLoader = (scopeId = 'default') => new PluginLoader(scopeId);
