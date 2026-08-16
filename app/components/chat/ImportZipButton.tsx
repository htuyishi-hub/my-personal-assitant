import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';
import { logStore } from '~/lib/stores/logs';
import { createChatFromZip } from '~/utils/zipImport';

interface ImportZipButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const ImportZipButton: React.FC<ImportZipButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const zipFile = event.target.files?.[0];
    event.target.value = '';

    if (!zipFile || !importChat) {
      return;
    }

    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please select a ZIP file');
      return;
    }

    const folderName = zipFile.name.replace(/\.zip$/i, '') || 'Imported ZIP';
    setIsLoading(true);
    const loadingToast = toast.loading(`Importing ${folderName}...`);

    try {
      const messages = await createChatFromZip(zipFile);
      await importChat(folderName, messages);
      logStore.logSystem('ZIP imported successfully', { folderName });
      toast.success('ZIP imported successfully');
    } catch (error) {
      logStore.logError('Failed to import ZIP', error, { folderName });
      console.error('Failed to import ZIP:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import ZIP');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  return (
    <>
      <input
        type="file"
        id="zip-import"
        className="hidden"
        accept=".zip,application/zip"
        onChange={handleFileChange}
      />
      <Button
        onClick={() => document.getElementById('zip-import')?.click()}
        title="Import ZIP"
        variant="default"
        size="lg"
        disabled={isLoading}
        className={classNames(
          'gap-2 bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary',
          'hover:bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center transition-all duration-200 ease-in-out',
          className,
        )}
      >
        <span className="i-ph:file-zip w-4 h-4" />
        {isLoading ? 'Importing...' : 'Import ZIP'}
      </Button>
    </>
  );
};