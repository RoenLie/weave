import { MirageMDE } from '../../mirage-mde.js';
import type { ToolbarButton, ToolbarItem } from '../../registry/action-registry.js';


export const performAction = (scope: MirageMDE, item?: ToolbarItem) => {
	assertAction(item);

	if (typeof item.action === 'function')
		item.action(scope.editor, scope);
	if (typeof item.action === 'string')
		globalThis.open(item.action, '_blank');
};


function assertAction(item?: ToolbarItem): asserts item is ToolbarButton {
	if (item?.type !== 'button')
		throw new Error('Invalid action', { cause: item });
}
