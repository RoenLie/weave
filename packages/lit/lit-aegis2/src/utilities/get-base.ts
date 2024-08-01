export const getBase = <T>(
	cls: { constructor: any },
): T => cls.constructor;
