// Spec: https://drafts.csswg.org/css-view-transitions/

declare interface Document extends DocumentViewTransition {}

declare interface DocumentViewTransition {
	/** @see https://drafts.csswg.org/css-view-transitions/#additions-to-document-api */
	startViewTransition?(updateCallback?: UpdateCallback): ViewTransition;
}

/** @see https://drafts.csswg.org/css-view-transitions/#viewtransition */
interface ViewTransition {
	readonly updateCallbackDone: Promise<void>;
	readonly ready: Promise<void>;
	readonly finished: Promise<void>;

	skipTransition(): void;
}

type UpdateCallback = () => Promise<void>;