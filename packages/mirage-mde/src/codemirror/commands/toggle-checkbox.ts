import { type StateCommand } from '@codemirror/state';

import { changeBySelectedLine } from '../utils/change-selected-line.js';


export const toggleCheckbox: StateCommand = ({ state, dispatch }) => {
	// Create or toggle markdown style check boxes: "- [ ]" and "- [x]", respecting indentation,
	// for all selected lines:
	const transaction = changeBySelectedLine(state, (line, changes, _range) => {
		const indent = line.text.search(/\S|$/);
		// Detect markdown bullet
		if ((line.text.substring(indent, indent + 2) == '- ') ||
        (line.text.substring(indent, indent + 2) == '* ')) {
			// Toggle an existing checkbox
			if (line.text.substring(indent + 2, indent + 5) == '[ ]') {
				changes.push({
					from:   line.from + indent + 3,
					to:     line.from + indent + 4,
					insert: 'x',
				});
			}
			else if (line.text.substring(indent + 2, indent + 5) == '[x]') {
				changes.push({
					from:   line.from + indent + 3,
					to:     line.from + indent + 4,
					insert: ' ',
				});
			}
			else {
				// Add new checkbox
				changes.push({
					from:   line.from + indent + 2,
					to:     line.from + indent + 2,
					insert: '[ ] ',
				});
			}
		}
		else {
			// No bullet, add one with checkbox
			changes.push({ from: line.from + indent, to: line.from + indent, insert: '- [ ] ' });
		}
	});

	if (!transaction.changes.empty)
		dispatch(state.update(transaction));

	return true;
};
