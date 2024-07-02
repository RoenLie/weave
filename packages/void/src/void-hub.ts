declare global {
	interface WindowEventMap {
		'void-load': CustomEvent<{element: HTMLElement; host: HTMLElement;}>;
		'void-get': CustomEvent<{element: HTMLElement; host: HTMLElement;}>;
		'void-form-get': CustomEvent<{
			element: HTMLFormElement;
			host: HTMLElement;
			submitter: HTMLElement;
		}>;
		'void-form-post': CustomEvent<{
			element: HTMLFormElement;
			host: HTMLElement;
			submitter: HTMLElement;
		}>;
	}
}


interface Target { id: string; element: HTMLElement; }


export const voidCache = new Map<string, WeakRef<HTMLElement>>();


const parser = new DOMParser();


const cacheGet = (id: string | null | undefined) =>
	id ? voidCache.get(id)?.deref() : undefined;


const getTargets = (
	host: HTMLElement, ...elements: HTMLElement[]
): Target | Target[] => {
	const element = elements.find(el => el.hasAttribute('void-target'));
	if (!element)
		return [];

	const targets = element.getAttribute('void-target')!
		.split(',')
		.map(a => a.trim());

	if (!targets.length) {
		return {
			id: '',
			element,
		};
	}

	if (targets.length === 1 && targets[0] === 'host') {
		return {
			id:      '',
			element: host,
		};
	}

	return targets.map(target => ({
		id:      target,
		element: cacheGet(target)!,
	}));
};


const replaceTargets = async (parsed: Document, targets: Target | Target[]) => {
	// If it's an array, it is void-id based replacements.
	// In this case we need to pluck the element from the response by the matching ID.
	if (Array.isArray(targets)) {
		const entries = targets.reduce((acc, oldEl) => {
			const query = '[void-id="' + oldEl.id + '"]';
			const newEl = parsed.querySelector(query) as HTMLElement | null;
			if (!newEl)
				return acc;

			voidCache.delete(oldEl.id);

			newEl.style.display = 'none';
			oldEl.element.insertAdjacentElement('afterend', newEl);

			acc.push([ oldEl.element, newEl ]);

			return acc;
		}, [] as [HTMLElement, HTMLElement][]);

		await new Promise<any>(res => requestIdleCallback(res));

		entries.forEach(([ oldEl, newEl ]) => {
			oldEl.remove();
			newEl.style.display = '';
		});
	}
	// If it's not an array, it is the host or the original element.
	// in this case, we just shuv the whole response into the target.
	else {
		const children = ([ ...parsed.body.children ] as HTMLElement[]).reverse();
		children.forEach(el => {
			el.style.display = 'none';
			targets.element.insertAdjacentElement('afterend', el);
		});

		await new Promise<any>(res => requestIdleCallback(res));

		targets.element.remove();
		children.forEach(el => el.style.display = '');
	}
};


globalThis.addEventListener('void-get', async ev => {
	const { element, host } = ev.detail;
	const url = element.getAttribute('void-get')!;

	const confirmMsg = element.getAttribute('void-confirm')
		|| element.getAttribute('void-confirm')!;

	if (confirmMsg && !confirm(confirmMsg))
		return;

	const response = await (await fetch(url)).text();
	const parsed = parser.parseFromString(response, 'text/html', {
		includeShadowRoots: true,
	});

	const targets = getTargets(host, element);
	await replaceTargets(parsed, targets);
});


globalThis.addEventListener('void-form-post', async ev => {
	const { element, host, submitter } = ev.detail;

	const url = submitter.getAttribute('void-post')
		|| element.getAttribute('void-post')!;

	const confirmMsg = submitter.getAttribute('void-confirm')
		|| element.getAttribute('void-confirm')!;

	if (confirmMsg && !confirm(confirmMsg))
		return;

	const targets = getTargets(host, submitter, element);

	const data = new URLSearchParams();
	for (const [ key, value ] of new FormData(element))
		data.append(key, value.toString());

	const response = await (await fetch(url, {
		method: 'post',
		body:   data,
	})).text();

	const parsed = parser.parseFromString(response, 'text/html', {
		includeShadowRoots: true,
	});

	await replaceTargets(parsed, targets);
});
