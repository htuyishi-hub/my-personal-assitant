import JSZip from 'jszip';
import { createChatFromFolder } from './folderImport';
import { isBinaryFile, MAX_FILES, shouldIncludeFile } from './fileUtils';
import type { Message } from 'ai';

const createZipFile = async (entry: JSZip.JSZipObject, path: string): Promise<File> => {
  const blob = await entry.async('blob');
  const file = new File([blob], path.split('/').pop() || 'file', { type: blob.type || 'text/plain' });

  // createChatFromFolder uses webkitRelativePath to preserve the folder tree.
  Object.defineProperty(file, 'webkitRelativePath', {
    configurable: true,
    value: `zip-root/${path}`,
  });

  return file;
};

export const createChatFromZip = async (zipFile: File): Promise<Message[]> => {
  const zip = await JSZip.loadAsync(zipFile);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const paths = entries.map((entry) => entry.name.replace(/^\/+/, ''));
  const includedEntries = entries.filter((entry) => shouldIncludeFile(entry.name.replace(/^\/+/, '')));

  if (includedEntries.length === 0) {
    throw new Error('No valid files found in the selected ZIP');
  }

  if (includedEntries.length > MAX_FILES) {
    throw new Error(
      `This ZIP contains ${includedEntries.length.toLocaleString()} files. Please select a ZIP with fewer than ${MAX_FILES.toLocaleString()} files.`,
    );
  }

  const files = await Promise.all(
    includedEntries.map((entry) => createZipFile(entry, entry.name.replace(/^\/+/, ''))),
  );
  const fileChecks = await Promise.all(files.map(async (file) => ({ file, isBinary: await isBinaryFile(file) })));
  const textFiles = fileChecks.filter(({ isBinary }) => !isBinary).map(({ file }) => file);
  const binaryFiles = fileChecks
    .filter(({ isBinary }) => isBinary)
    .map(({ file }) => file.webkitRelativePath.split('/').slice(1).join('/'));

  if (textFiles.length === 0) {
    throw new Error('No text files found in the selected ZIP');
  }

  const folderName = zipFile.name.replace(/\.zip$/i, '') || 'Imported ZIP';
  const messages = await createChatFromFolder(textFiles, binaryFiles, folderName);
  const skippedIgnoredFiles = paths.filter((path) => !shouldIncludeFile(path));

  if (skippedIgnoredFiles.length > 0) {
    const firstMessage = messages.find((message) => message.role === 'assistant');

    if (firstMessage && typeof firstMessage.content === 'string') {
      firstMessage.content += `\n\nSkipped ${skippedIgnoredFiles.length} ignored files from the ZIP.`;
    }
  }

  return messages;
};