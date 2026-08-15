import type { Message } from 'ai';
import JSZip from 'jszip';
import { createChatFromFolder } from '~/utils/folderImport';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';

/**
 * Create a File object that carries a `webkitRelativePath`, so the rest of the
 * import pipeline (which was written for folder uploads) can treat entries
 * extracted from a ZIP exactly like entries from a picked folder.
 */
function createFileWithRelativePath(blob: Blob, relativePath: string): File {
  const name = relativePath.split('/').pop() || relativePath;
  const file = new File([blob], name, { type: blob.type });

  Object.defineProperty(file, 'webkitRelativePath', {
    value: relativePath,
    writable: false,
    configurable: true,
  });

  return file;
}

/**
 * Determine a single common top-level folder shared by every entry, if one
 * exists. GitHub/most tools produce zips like `repo-main/...` — we keep that
 * folder as the project root. When entries live at different top levels we
 * synthesize a root from the archive name so path stripping stays consistent
 * with folder import (which drops the first path segment).
 */
function resolveRoot(paths: string[], fallbackRoot: string): { root: string; hasCommonRoot: boolean } {
  if (paths.length === 0) {
    return { root: fallbackRoot, hasCommonRoot: false };
  }

  const firstSegment = paths[0].split('/')[0];
  const allShareRoot =
    firstSegment !== '' && paths.every((p) => p.split('/')[0] === firstSegment && p.includes('/'));

  if (allShareRoot) {
    return { root: firstSegment, hasCommonRoot: true };
  }

  return { root: fallbackRoot, hasCommonRoot: false };
}

export interface ZipImportResult {
  messages: Message[];
  projectName: string;
  textFileCount: number;
  binaryFileCount: number;
}

/**
 * Read a `.zip` archive and turn its contents into the same chat messages a
 * folder import produces, so the AI ingests the project identically.
 */
export const createChatFromZip = async (zipFile: File): Promise<ZipImportResult> => {
  const baseName = zipFile.name.replace(/\.zip$/i, '') || 'imported-project';

  const zip = await JSZip.loadAsync(zipFile);

  // Collect all non-directory entries.
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const entryPaths = entries.map((entry) => entry.name);

  const { root, hasCommonRoot } = resolveRoot(entryPaths, baseName);
  const projectName = hasCommonRoot ? root : baseName;

  // Build File objects with a normalized `webkitRelativePath` of `root/rel/path`.
  const allFiles: File[] = await Promise.all(
    entries.map(async (entry) => {
      const blob = await entry.async('blob');
      const relativePath = hasCommonRoot ? entry.name : `${root}/${entry.name}`;

      return createFileWithRelativePath(blob, relativePath);
    }),
  );

  // Apply the same ignore filters as folder import (path minus the root segment).
  const filteredFiles = allFiles.filter((file) => {
    const path = file.webkitRelativePath.split('/').slice(1).join('/');
    return path !== '' && shouldIncludeFile(path);
  });

  if (filteredFiles.length === 0) {
    throw new Error('No valid files found in the ZIP archive');
  }

  if (filteredFiles.length > MAX_FILES) {
    throw new Error(
      `This ZIP contains ${filteredFiles.length.toLocaleString()} files. Please use an archive with fewer than ${MAX_FILES.toLocaleString()} files.`,
    );
  }

  // Separate text from binary files (binaries are skipped, like folder import).
  const fileChecks = await Promise.all(
    filteredFiles.map(async (file) => ({
      file,
      isBinary: await isBinaryFile(file),
    })),
  );

  const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
  const binaryFilePaths = fileChecks
    .filter((f) => f.isBinary)
    .map((f) => f.file.webkitRelativePath.split('/').slice(1).join('/'));

  if (textFiles.length === 0) {
    throw new Error('No text files found in the ZIP archive');
  }

  const messages = await createChatFromFolder(textFiles, binaryFilePaths, projectName);

  return {
    messages,
    projectName,
    textFileCount: textFiles.length,
    binaryFileCount: binaryFilePaths.length,
  };
};
