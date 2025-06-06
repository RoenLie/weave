import type { PluginPass } from '@babel/core';
import type { VisitNodeFunction } from '@babel/traverse';
import type { Program } from '@babel/types';


export const postprocess: VisitNodeFunction<PluginPass, Program> = (...args): void => {

};
