import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { DeployButton } from '~/components/deploy/DeployButton';
import { GitHubAuthDialog } from '~/components/@settings/tabs/github/components/GitHubAuthDialog';
import { CommitPushDialog } from '~/components/github/CommitPushDialog';
import { GitHubSyncButton } from '~/components/github/GitHubSyncButton';
import { useGitHubConnection } from '~/lib/hooks';
import { getLocalStorage } from '~/lib/persistence/localStorage';
import { chatId } from '~/lib/persistence/useChatHistory';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted: _chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const [isGitHubMenuOpen, setIsGitHubMenuOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);
  const previews = useStore(workbenchStore.previews);
  const currentChatId = useStore(chatId);
  const { isConnected } = useGitHubConnection();
  const activePreview = previews[activePreviewIndex];
  const savedRepo = getLocalStorage(`github-repo-${currentChatId}`) as { url?: string } | null;

  const shouldShowButtons = activePreview;

  return (
    <div className="flex items-center gap-1">
      {/* Deploy Button */}
      {shouldShowButtons && <DeployButton />}

      {shouldShowButtons && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsGitHubMenuOpen((open) => !open)}
            className="flex items-center gap-1.5 rounded-md border border-bolt-elements-borderColor px-3 py-1.5 text-xs text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-1"
            title="GitHub source controls"
          >
            <div className="i-ph:github-logo text-base" />
            <span>GitHub</span>
            <div className="i-ph:caret-down" />
          </button>
          {isGitHubMenuOpen && (
            <div className="absolute right-0 top-9 z-40 min-w-[220px] rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setIsGitHubMenuOpen(false);
                  setIsAuthDialogOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2"
              >
                <span className="i-ph:plug w-4 h-4" />
                {isConnected ? 'Reconnect GitHub' : 'Connect GitHub'}
              </button>
              <button
                type="button"
                disabled={!isConnected}
                onClick={() => {
                  setIsGitHubMenuOpen(false);
                  setIsPushDialogOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="i-ph:git-commit w-4 h-4" />
                Commit &amp; push source
              </button>
              <GitHubSyncButton onDone={() => setIsGitHubMenuOpen(false)} />
              {savedRepo?.url && (
                <button
                  type="button"
                  onClick={() => window.open(savedRepo.url, '_blank', 'noopener,noreferrer')}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2"
                >
                  <span className="i-ph:arrow-square-out w-4 h-4" />
                  Open on GitHub
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <GitHubAuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        onSuccess={() => setIsAuthDialogOpen(false)}
      />
      <CommitPushDialog isOpen={isPushDialogOpen} onClose={() => setIsPushDialogOpen(false)} />

      {/* Debug Tools */}
      {shouldShowButtons && (
        <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden text-sm">
          <button
            onClick={() =>
              window.open('https://github.com/stackblitz-labs/AllAble/issues/new?template=bug_report.yml', '_blank')
            }
            className="rounded-l-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-bolt-elements-item-contentAccent [&:not(:disabled,.disabled)]:hover:bg-bolt-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5"
            title="Report Bug"
          >
            <div className="i-ph:bug" />
            <span>Report Bug</span>
          </button>
          <div className="w-px bg-bolt-elements-borderColor" />
          <button
            onClick={async () => {
              try {
                const { downloadDebugLog } = await import('~/utils/debugLogger');
                await downloadDebugLog();
              } catch (error) {
                console.error('Failed to download debug log:', error);
              }
            }}
            className="rounded-r-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-bolt-elements-item-contentAccent [&:not(:disabled,.disabled)]:hover:bg-bolt-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5"
            title="Download Debug Log"
          >
            <div className="i-ph:download" />
            <span>Debug Log</span>
          </button>
        </div>
      )}
    </div>
  );
}
