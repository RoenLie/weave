import { TemplateResult } from 'lit';


export const Content = {
	createContent: (
		id: string,
		label: string,
		renderFn: () => TemplateResult,
	) => {
		let cmp = document.createElement('mi-content');
		Object.assign(cmp, {
			id,
			containedLabel: label,
			renderFn,
		});

		return cmp;
	},
};
