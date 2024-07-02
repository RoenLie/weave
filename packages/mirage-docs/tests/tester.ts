import { join, normalize, resolve } from 'path';


//const sourcePath = 'C:/Devstuff/PersonalProjects/mirage-docs/docpages/pages';
const sourcePath = 'C:/Devstuff/PersonalProjects/mirage-docs/docpages';
const normalizedSourcePath = normalize(sourcePath);
console.log({ normalizedSourcePath });


const libPath = 'C:/Devstuff/PersonalProjects/mirage-docs/docs/.mirage';
const normalizedLibPath = normalize(libPath);
console.log({ normalizedLibPath });


const filePath = 'C:/Devstuff/PersonalProjects/mirage-docs/docpages/pages/1.category-1/editortest.editor.ts';
const normalizedFilePath = normalize(filePath);
console.log({ normalizedFilePath });


const filePathMinusSourcePath = filePath.replace(sourcePath, '');
console.log({ filePathMinusSourcePath });

const absoluteCachePath = join(libPath, filePathMinusSourcePath);
console.log({ absoluteCachePath });
