interface OpfsFile {
	kind:         'file';
	name:         string;
	size:         number;
	type:         string;
	lastModified: number;
	relativePath: string;
	handle:       FileSystemFileHandle;
}

interface OpfsDirectory {
	kind:         'directory';
	name:         string;
	relativePath: string;
	entries:      Record<string, any>;
	handle:       FileSystemDirectoryHandle;
}


export const getDirectoryEntriesRecursive = async (
	directoryHandle: FileSystemDirectoryHandle,
	relativePath: string = '.',
) => {
	const fileHandles = [];
	const directoryHandles = [];
	const entries: Record<string, OpfsFile | OpfsDirectory> = {};
	const directoryIterator: Iterable<Promise<FileSystemFileHandle | FileSystemDirectoryHandle>> =
		(directoryHandle as any).values();

	const directoryEntryPromises: Promise<(OpfsFile | OpfsDirectory)>[] = [];

	for await (const handle of directoryIterator) {
		const nestedPath = `${ relativePath }/${ handle.name }`;
		if (handle.kind === 'file') {
			fileHandles.push({ handle, nestedPath });
			directoryEntryPromises.push(
				handle.getFile().then((file) => {
					return {
						name:         handle.name,
						kind:         handle.kind,
						size:         file.size,
						type:         file.type,
						lastModified: file.lastModified,
						relativePath: nestedPath,
						handle,
					};
				}),
			);
		}
		else if (handle.kind === 'directory') {
			directoryHandles.push({ handle, nestedPath });
			directoryEntryPromises.push(
				(async () => {
					return {
						name:         handle.name,
						kind:         handle.kind,
						relativePath: nestedPath,
						entries:
					  await getDirectoryEntriesRecursive(handle, nestedPath),
						handle,
					};
				})(),
			);
		}
	}
	const directoryEntries = await Promise.all(directoryEntryPromises);
	directoryEntries.forEach((directoryEntry) => {
		entries[directoryEntry.name] = directoryEntry;
	});

	return entries;
};


declare global {
	interface FileSystemHandle {
		remove(options?: { recursive?: boolean }): Promise<void>;
	}
}
