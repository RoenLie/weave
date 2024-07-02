import { join, normalize } from 'node:path';


export class DocPath {

	public static createFileRoute(
		absoluteFilePath: string,
		absoluteSourcePath: string,
	) {
		// C:\\Devstuff\\PersonalProjects\\mirage-docs\\docpages\\pages\\1.category-1\\editortest.editor.ts
		absoluteFilePath = normalize(absoluteFilePath);
		// C:\\Devstuff\\PersonalProjects\\mirage-docs\\docpages
		absoluteSourcePath = normalize(absoluteSourcePath);

		// \\pages\\1.category-1\\editortest.editor.ts
		const filePathTail = absoluteFilePath.replace(absoluteSourcePath, '');

		// \\pages\\1.category-1\\editortest.editor
		const withoutExtension = filePathTail.split('.').slice(0, -1).join('.');

		return withoutExtension.replaceAll(/\\+/g, '/');
	}

	public static createFileCachePath(
		absoluteFilePath: string,
		absoluteSourcePath: string,
		absoluteCachePath: string,
		newExtension: string,
	) {
		// C:\\Devstuff\\PersonalProjects\\mirage-docs\\docpages\\pages\\1.category-1\\editortest.editor.ts
		absoluteFilePath = normalize(absoluteFilePath);
		// C:\\Devstuff\\PersonalProjects\\mirage-docs\\docs\\.mirage
		absoluteCachePath = normalize(absoluteCachePath);
		// C:\\Devstuff\\PersonalProjects\\mirage-docs\\docpages
		absoluteSourcePath = normalize(absoluteSourcePath);

		// \\pages\\1.category-1\\editortest.editor.ts
		const filePathTail = absoluteFilePath.replace(absoluteSourcePath, '');
		// C:\\Devstuff\\PersonalProjects\\mirage-docs\\docs\\.mirage\\pages\\1.category-1\\editortest.editor.ts
		const absoluteFileCachePath = join(absoluteCachePath, filePathTail);

		// C:\\Devstuff\\PersonalProjects\\mirage-docs\\docs\\.mirage\\pages\\1.category-1\\editortest.editor.html
		const withNewExtension = absoluteFileCachePath
			.split('.').slice(0, -1).join('.') + '.' + newExtension;

		return withNewExtension;
	}

}
