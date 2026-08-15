import React, { useRef, useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { Dropdown, DropdownItem, DropdownSeparator } from '~/components/ui/Dropdown';
import { IconButton } from '~/components/ui/IconButton';
import GitCloneButton from './GitCloneButton';
import { MAX_FILES, isBinaryFile, shouldIncludeFile } from '~/utils/fileUtils';
import { createChatFromFolder } from '~/utils/folderImport';
import { createChatFromZip } from '~/utils/zipImport';
import { logStore } from '~/lib/stores/logs';

interface ImportMenuProps {
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  handleFileUpload: () => void;
  disabled?: boolean;
}

/**
 * A compact, always-available menu in the chat input toolbar that exposes every
 * way to bring local or remote projects into the workspace: uploading files,
 * importing a folder, importing a ZIP, and cloning from GitHub/GitLab.
 */
export const ImportMenu: React.FC<ImportMenuProps> = ({ importChat, handleFileUpload, disabled }) => {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [cloneOpen, setCloneOpen] = useState(false);

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || []);

    const filteredFiles = allFiles.filter((file) => {
      const path = file.webkitRelativePath.split('/').slice(1).join('/');
      return shouldIncludeFile(path);
    });

    if (filteredFiles.length === 0) {
      toast.error('No files found in the selected folder');
      e.target.value = '';

      return;
    }

    if (filteredFiles.length > MAX_FILES) {
      toast.error(
        `This folder contains ${filteredFiles.length.toLocaleString()} files. Please select a folder with fewer than ${MAX_FILES.toLocaleString()} files.`,
      );
      e.target.value = '';

      return;
    }

    const folderName = filteredFiles[0]?.webkitRelativePath.split('/')[0] || 'Unknown Folder';
    const loadingToast = toast.loading(`Importing ${folderName}...`);

    try {
      const fileChecks = await Promise.all(
        filteredFiles.map(async (file) => ({ file, isBinary: await isBinaryFile(file) })),
      );

      const textFiles = fileChecks.filter((f) => !f.isBinary).map((f) => f.file);
      const binaryFilePaths = fileChecks
        .filter((f) => f.isBinary)
        .map((f) => f.file.webkitRelativePath.split('/').slice(1).join('/'));

      if (textFiles.length === 0) {
        toast.error('No text files found in the selected folder');

        return;
      }

      if (binaryFilePaths.length > 0) {
        toast.info(`Skipping ${binaryFilePaths.length} binary files`);
      }

      const messages = await createChatFromFolder(textFiles, binaryFilePaths, folderName);

      if (importChat) {
        await importChat(folderName, [...messages]);
      }

      logStore.logSystem('Folder imported successfully', {
        folderName,
        textFileCount: textFiles.length,
        binaryFileCount: binaryFilePaths.length,
      });
      toast.success('Folder imported successfully');
    } catch (error) {
      logStore.logError('Failed to import folder', error, { folderName });
      console.error('Failed to import folder:', error);
      toast.error('Failed to import folder');
    } finally {
      toast.dismiss(loadingToast);
      e.target.value = '';
    }
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!/\.zip$/i.test(file.name)) {
      toast.error('Please select a .zip file');
      e.target.value = '';

      return;
    }

    const loadingToast = toast.loading(`Importing ${file.name}...`);

    try {
      const { messages, projectName, textFileCount, binaryFileCount } = await createChatFromZip(file);

      if (binaryFileCount > 0) {
        toast.info(`Skipping ${binaryFileCount} binary files`);
      }

      if (importChat) {
        await importChat(projectName, [...messages]);
      }

      logStore.logSystem('ZIP imported successfully', { projectName, textFileCount, binaryFileCount });
      toast.success('ZIP imported successfully');
    } catch (error) {
      logStore.logError('Failed to import ZIP', error, { fileName: file.name });
      console.error('Failed to import ZIP:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import ZIP');
    } finally {
      toast.dismiss(loadingToast);
      e.target.value = '';
    }
  };

  return (
    <>
      {/* Hidden inputs for folder and zip selection */}
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        webkitdirectory=""
        directory=""
        onChange={handleFolderChange}
        {...({} as any)}
      />
      <input
        ref={zipInputRef}
        type="file"
        className="hidden"
        accept=".zip,application/zip"
        onChange={handleZipChange}
      />

      {/* Controlled clone dialog (button hidden; opened from the menu item) */}
      <GitCloneButton importChat={importChat} hideButton open={cloneOpen} onOpenChange={setCloneOpen} />

      <Dropdown
        align="start"
        trigger={
          <IconButton title="Import project" className="transition-all" disabled={disabled}>
            <div className="i-ph:plus-circle text-xl" />
          </IconButton>
        }
      >
        <DropdownItem onSelect={() => handleFileUpload()}>
          <div className="i-ph:paperclip text-lg" />
          Upload files
        </DropdownItem>
        <DropdownItem onSelect={() => folderInputRef.current?.click()}>
          <div className="i-ph:folder-simple-plus text-lg" />
          Import folder
        </DropdownItem>
        <DropdownItem onSelect={() => zipInputRef.current?.click()}>
          <div className="i-ph:file-zip text-lg" />
          Import ZIP
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => setCloneOpen(true)}>
          <div className="i-ph:git-branch text-lg" />
          Clone from GitHub
        </DropdownItem>
      </Dropdown>
    </>
  );
};
