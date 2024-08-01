import { PluginContainer } from './plugin.ts';


/**
 * The root plugin container.
 *
 * Available for use without a scope and without using awaiting Load.
 *
 * This is a global singleton container and should be used with care,
 *
 * as anything loaded here will always be available for all scopes.
 */
export const rootContainer = new PluginContainer({ defaultScope: 'Singleton', skipBaseClassChecks: true });
