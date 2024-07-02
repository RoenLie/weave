import { ViewUpdate } from '@codemirror/view';

import { MirageMDE } from '../../mirage-mde.js';
import { getNodesInRange } from './get-state.js';


export const updateToolbarStateListener = (update: ViewUpdate, scope: MirageMDE) => {
	const {
		state,
		state: { selection: { ranges } },
	} = update;

	if (!update.selectionSet)
		return;

	const nodes = ranges.flatMap(range => getNodesInRange(state, range));

	scope.activeMarkers = nodes.map(node => node.marker);
	scope.gui.toolbar.requestUpdate();
};
