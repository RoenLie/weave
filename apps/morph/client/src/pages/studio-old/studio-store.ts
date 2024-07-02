import { StateStore } from '@roenlie/lit-state-store';

import type {
	ModuleNamespace,
	NamespaceDefinition,
} from '../../features/code-module/namespace-model.js';
import type { EditorTab } from './editor.cmp.js';

export class StudioStore extends StateStore {
	public activeNamespace = '';
	public activeModuleId = '';
	public availableNamespaces: NamespaceDefinition[] = [];
	public availableModules: ModuleNamespace[] = [];
	public editorTabs = new Map<string, EditorTab>();
	public activeEditorTab: EditorTab | undefined = undefined;
}
