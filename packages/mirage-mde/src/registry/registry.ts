import { type stringliteral } from '@roenlie/mimic-core/types';

import { type BuiltInAction, builtInActions, type ToolbarItem } from './action-registry.js';
import { type BuiltInDrawables, builtInDraws } from './draw-registry.js';
import { builtInStatuses, type StatusBarItem } from './status-registry.js';


export interface Registry {
	action: Map<stringliteral | BuiltInAction, ToolbarItem>;
	status: Map<stringliteral, StatusBarItem>;
	draw: Map<stringliteral | BuiltInDrawables, string>;
}


export const createRegistry = (): Registry => {
	return {
		action: new Map(builtInActions),
		status: new Map(builtInStatuses),
		draw:   new Map(builtInDraws),
	};
};
