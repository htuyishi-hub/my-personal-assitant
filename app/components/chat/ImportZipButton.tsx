import React, { useState } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { createChatFromZip } from '~/utils/zipImport';
import { logStore } from '~/lib/stores/logs';
import { Button } from '~/components/ui/Button';
import { classNames } from '~/utils/classNames';

interface ImportZipButtonProps {
  className?: string;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export const ImportZipButton: React.FC<ImportZipButtonProps> = ({ className, importChat }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!/\.zip$/i.test(file.name)) {
      toast.error('Please select a .zip file');
      e.target.value = '';

      return;
    }

    setIsLoading(true);

    const loadingToast = toast.loading(`Importing ${file.name}...`);

    try {
      const { messages, projectName, textFileCount, binaryFileCount } = await createChatFromZip(file);

      if (binaryFileCount > 0) {
        toast.info(`Skipping ${binaryFileCount} binary files`);
      }

      if (importChat) {
        await importChat(projectName, [...messages]);
      }

      logStore.logSystem('ZIP imported successfully', {
        projectName,
        textFileCount,
        binaryFileCount,
      });
      toast.success('ZIP imported successfully');
    } catch (error) {
      logStore.logError('Failed to import ZIP', error, { fileName: file.name });
      console.error('Failed to import ZIP:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import ZIP');
    } finally {
      setIsLoading(false);
      toast.dismiss(loadingToast);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <>
      <input type="file" id="zip-import" className="hidden" accept=".zip,application/zip" onChange={handleFileChange} />
      <Button
        onClick={() => {
          const input = document.getElementById('zip-import');
          input?.click();
        }}
        title="Import ZIP"
        variant="default"
        size="lg"
        className={classNames(
          'gap-2 bg-bolt-elements-background-depth-1',
          'text-bolt-elements-textPrimary',
          'hover:bg-bolt-elements-background-depth-2',
          'border border-bolt-elements-borderColor',
          'h-10 px-4 py-2 min-w-[120px] justify-center',
          'transition-all duration-200 ease-in-out',
          className,
        )}
        disabled={isLoading}
      >
        <span className="i-ph:file-zip w-4 h-4" />
        {isLoading ? 'Importing...' : 'Import ZIP'}
      </Button>
    </>
  );
};
