import loader from '@monaco-editor/loader';
import type { editor } from 'monaco-editor';


interface CancelablePromise<T> extends Promise<T> {
	cancel: () => void;
}

export type { editor };
export type LoadedEditor = ReturnType<Awaited<typeof monaco>['editor']['create']>;
export type Loader = Awaited<ReturnType<typeof loader['init']>>;
export type LoaderPromise = CancelablePromise<Loader>;
export const monaco = loader.init() as LoaderPromise;
