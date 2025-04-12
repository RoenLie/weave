let devMode = false;


export const setDevMode = (value: boolean): boolean => devMode = value;
export const fileExt = (): 'ts' | 'js' => devMode ? 'ts' : 'js';
