import type { Module } from './module-model.js';

export interface NamespaceDefinition extends Pick<Module, 'namespace'> {}

export interface ModuleNamespace extends Omit<Module, 'code'> {}
