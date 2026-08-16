import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useStore } from '@nanostores/react';
import { getLocalStorage } from '~/lib/persistence/localStorage';
import { chatId } from '~/lib/persistence/useChatHistory';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';

interface CommitPushDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedRepository {
  owner: string;
  name: string;
  url: string;
}

export function CommitPushDialog({ isOpen, onClose }: CommitPushDialogProps) {
  const currentChatId = useStore(chatId);
  const [repoName, setRepoName] = useState('');
  const [branchName, setBranchName] = useState('main');
  const [commitMessage, setCommitMessage] = useState('Update source from AllAble');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const saved = getLocalStorage(`github-repo-${currentChatId}`) as SavedRepository | null;
    setRepoName(saved?.name || '');
  }, [currentChatId, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const connection = getLocalStorage('github_connection') as {
      token?: string;
      user?: { login?: string };
    } | null;

    if (!connection?.token || !connection.user?.login) {
      toast.error('Connect GitHub before pushing source.');
      return;
    }

    if (!repoName.trim() || !branchName.trim() || !commitMessage.trim()) {
      toast.error('Repository, branch, and commit message are required.');
      return;
    }

    setIsLoading(true);

    try {
      const repoUrl = await workbenchStore.pushToRepository(
        'github',
        repoName.trim(),
        commitMessage.trim(),
        connection.user.login,
        connection.token,
        isPrivate,
        branchName.trim(),
      );

      localStorage.setItem(
        `github-repo-${currentChatId}`,
        JSON.stringify({
          owner: connection.user.login,
          name: repoName.trim(),
          url: repoUrl,
        }),
      );
      toast.success('Source pushed to GitHub');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to push source to GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[201] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <Dialog.Title className="text-lg font-semibold text-bolt-elements-textPrimary">
                  Commit &amp; push source
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-bolt-elements-textSecondary">
                  Push the current workbench files without running a production build.
                </Dialog.Description>
              </div>
              <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-bolt-elements-background-depth-2">
                <div className="i-ph:x h-4 w-4 text-bolt-elements-textSecondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-bolt-elements-textSecondary">Repository</span>
                <input
                  value={repoName}
                  onChange={(event) => setRepoName(event.target.value)}
                  placeholder="my-project"
                  className="w-full rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 text-sm text-bolt-elements-textPrimary outline-none focus:border-bolt-elements-borderColorActive"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-bolt-elements-textSecondary">Branch</span>
                <input
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  placeholder="main"
                  className="w-full rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 text-sm text-bolt-elements-textPrimary outline-none focus:border-bolt-elements-borderColorActive"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-bolt-elements-textSecondary">Commit message</span>
                <input
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  className="w-full rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 px-3 py-2 text-sm text-bolt-elements-textPrimary outline-none focus:border-bolt-elements-borderColorActive"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                <input type="checkbox" checked={isPrivate} onChange={(event) => setIsPrivate(event.target.checked)} />
                Create new repositories as private
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-bolt-elements-textSecondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={classNames(
                    'rounded-lg bg-[#303030] px-4 py-2 text-sm text-white hover:bg-[#5E41D0]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  )}
                >
                  {isLoading ? 'Pushing...' : 'Commit & push'}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}