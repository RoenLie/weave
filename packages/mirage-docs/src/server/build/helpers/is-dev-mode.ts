let devMode = false;


export const setDevMode = (value: boolean) => devMode = value;
export const fileExt = () => devMode ? 'ts' : 'js';
