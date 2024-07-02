import { voidCache } from './void-hub.js';


class Listeners {

	protected cache: [ target: Element, event: string, fn: EventListener ][] = [];

	public add(target: Element, event: string, fn: EventListener) {
		target.addEventListener(event, fn);
		this.cache.push([ target, event, fn ]);
	}

	public disconnect() {
		for (const [ t, e, f ] of this.cache)
			t.removeEventListener(e, f);

		this.cache.length = 0;
	}

}


class VoidInitializer extends HTMLElement {

	protected static invalidElements: typeof HTMLElement[] = [
		HTMLScriptElement,
		HTMLLinkElement,
		VoidInitializer,
	];

	protected static mutHandler = (mutations: MutationRecord[]) => {
		for (const entry of mutations) {
			for (const node of entry.removedNodes) {
				if (!(node instanceof HTMLElement))
					continue;

				const voidId = node.getAttribute('void-id');
				if (!voidId)
					continue;

				const ref = voidCache.get(voidId);
				if (ref?.deref() === node)
					voidCache.delete(voidId);
			}
			for (const node of entry.addedNodes) {
				if (!(node instanceof HTMLElement))
					continue;

				const voidId = node.getAttribute('void-id');
				if (!voidId)
					continue;

				voidCache.set(voidId, new WeakRef(node));
			}
		}
	};

	protected mutObserver = new MutationObserver(VoidInitializer.mutHandler);
	protected listeners = new Listeners();
	protected parentHost: HTMLElement;
	protected parentRoot: ShadowRoot;

	public connectedCallback() {
		let root: Node | undefined = this.parentNode ?? undefined;
		while (root && !(root instanceof ShadowRoot))
			root = root?.parentNode ?? undefined;

		if (!root)
			throw new Error('No parent root available');

		this.parentRoot = root;
		this.parentHost = root.host as HTMLElement;

		this.mutObserver.observe(
			this.parentRoot,
			{ subtree: true, childList: true },
		);

		this.syncElements(this.parentRoot);
	}

	public disconnectedCallback() {
		this.mutObserver.disconnect();
		this.listeners.disconnect();
	}

	protected getElementForm(el: HTMLElement) {
		const host = this.parentHost;

		return ('form' in el ? el.form
			: 'form' in host ? host.form
				: undefined) as HTMLFormElement | undefined;
	}

	protected syncElements(root: ShadowRoot) {
		const elements = [ this.parentHost, ...root.querySelectorAll('*') ];

		for (const element of elements) {
			const isHTMLElement = element instanceof HTMLElement;
			const isValid = !VoidInitializer.invalidElements.some(el => element instanceof el);
			if (isHTMLElement && isValid)
				this.parseElement(element);
		}
	}

	protected addToCache(id: string, element: HTMLElement) {
		voidCache.set(id, new WeakRef(element));
	}

	protected parseElement(el: HTMLElement) {
		const id = el.getAttribute('void-id');
		id && this.addToCache(id, el);

		this.evalClickHandler(el);
		this.evalLoadHandler(el);
		this.evalFormHandler(el);
	}

	protected methods = [ 'get', 'post', 'put', 'patch', 'delete' ] as const;
	protected getMethod(el: HTMLElement) {
		return this.methods.find(method => el.hasAttribute('void-' + method));
	}

	protected evalClickHandler(el: HTMLElement) {
		const method = this.getMethod(el);
		if (!method)
			return;

		const trigger = el.getAttribute('void-trigger') ?? 'click';
		if (trigger !== 'click')
			return;

		const form = this.getElementForm(el);
		if (form)
			return;

		this.listeners.add(el, 'click', ev => {
			ev.preventDefault();

			const detail: any = {
				element: el,
				host:    this.parentHost,
			};

			const event = new CustomEvent('void-' + method, { detail });
			window.dispatchEvent(event);
		});
	}

	protected evalLoadHandler(el: HTMLElement) {
		const method = this.getMethod(el);
		if (!method)
			return;

		const trigger = el.getAttribute('void-trigger');
		if (trigger !== 'load')
			return;

		const detail: any = {
			element: el,
			host:    this.parentHost,
		};

		const event = new CustomEvent('void-load', { detail });
		window.dispatchEvent(event);
	}

	protected evalFormHandler(el: HTMLElement) {
		if (!(el instanceof HTMLFormElement))
			return;
		if (!el.hasAttribute('void-boosted'))
			return;

		el.addEventListener('submit', (ev) => {
			ev.preventDefault();

			const submitter = ev.submitter!;
			const method = this.getMethod(submitter) ?? this.getMethod(el);
			const detail: any = {
				element: el,
				host:    this.parentHost,
				submitter,
			};

			const event = new CustomEvent('void-form-' + method, { detail });
			window.dispatchEvent(event);
		});
	}

}
customElements.define('void-initializer', VoidInitializer);
