export async function registerColorOpacityWorklet(): Promise<void> {
	if ('paintWorklet' in CSS) {
		try {
			await CSS.paintWorklet.addModule('/houdini/color-opacity.js');
			console.log('Color opacity worklet registered successfully');
		}
		catch (error) {
			console.error('Failed to register color opacity worklet:', error);
		}
	}
	else {
		console.warn('Paint Worklet not supported in this browser');
	}
}


declare global {
	namespace CSS {
		// eslint-disable-next-line no-var
		var paintWorklet: { addModule: (moduleURL: string) => Promise<void>; };
	}
}
