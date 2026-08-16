import { useState } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { useGit } from '~/lib/hooks/useGit';
import { getLocalStorage } from '~/lib/persistence/localStorage';
import { workbenchStore } from '~/lib/stores/workbench';
import { chatId } from '~/lib/persistence/useChatHistory';

interface GitHubSyncButtonProps {
  onDone?: () => void;
}

export function GitHubSyncButton({ onDone }: GitHubSyncButtonProps) {
  const { ready, gitClone } = useGit();
  const currentChatId = useStore(chatId);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    const savedRepo = getLocalStorage(`github-repo-${currentChatId}`) as
      | { owner?: string; name?: string }
      | null;

    if (!savedRepo?.owner || !savedRepo.name) {
      toast.error('Push this chat to GitHub first so it has a repository to sync.');
      return;
    }

    setIsSyncing(true);

    try {
      const { workdir, data } = await gitClone(`https://github.com/${savedRepo.owner}/${savedRepo.name}`);

      for (const [filePath, entry] of Object.entries(data)) {
        const content =
          typeof entry.data === 'string'
            ? entry.data
            : entry.data instanceof Uint8Array
              ? new TextDecoder().decode(entry.data)
              : '';

        if (!content) {
          continue;
        }

        workbenchStore.files.setKey(`${workdir}/${filePath}`, {
          type: 'file',
          content,
          isBinary: false,
        });
      }

      toast.success('Latest GitHub source synced to the workbench');
      onDone?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync from GitHub');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={!ready || isSyncing}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 disabled:opacity-50"
    >
      <span className="i-ph:arrow-clockwise w-4 h-4" />
      {isSyncing ? 'Syncing…' : 'Sync latest source'}
    </button>
  );
}