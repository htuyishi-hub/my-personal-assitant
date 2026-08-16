import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { useGitHubConnection } from '~/lib/hooks';
import type { GitHubUserResponse } from '~/types/GitHub';

interface GitHubAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function GitHubAuthDialog({ isOpen, onClose, onSuccess }: GitHubAuthDialogProps) {
  const { connect, validateToken, isConnecting, error } = useGitHubConnection();
  const [token, setToken] = useState('');
  const [tokenType, setTokenType] = useState<'classic' | 'fine-grained'>('classic');
  const [validatedUser, setValidatedUser] = useState<GitHubUserResponse | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const detectTokenType = (value: string): 'classic' | 'fine-grained' => {
    return value.trim().startsWith('github_pat_') ? 'fine-grained' : 'classic';
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const trimmedToken = token.trim();

    if (trimmedToken.length < 10) {
      setValidatedUser(null);
      setScopes([]);
      setValidationError(null);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsValidating(true);
      setValidationError(null);

      try {
        const result = await validateToken(trimmedToken, tokenType);
        setValidatedUser(result.user);
        setScopes(result.scopes);
      } catch (validationFailure) {
        setValidatedUser(null);
        setScopes([]);
        setValidationError(validationFailure instanceof Error ? validationFailure.message : 'Token validation failed');
      } finally {
        setIsValidating(false);
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [isOpen, token, tokenType, validateToken]);

  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'allable-github-oauth') {
        return;
      }

      if (event.data.error) {
        setValidationError(event.data.error);
        return;
      }

      if (!event.data.token) {
        return;
      }

      try {
        await connect(event.data.token, event.data.tokenType === 'fine-grained' ? 'fine-grained' : 'classic');
        onSuccess?.();
        handleClose();
      } catch {
        // The hook exposes the connection error in the dialog.
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  });

  const handleOAuth = () => {
    const popup = window.open('/api/auth/github', 'github-oauth', 'width=640,height=760,resizable=yes,scrollbars=yes');

    if (!popup) {
      setValidationError('Please allow pop-ups to sign in with GitHub.');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim() || !validatedUser) {
      setValidationError('Enter a valid GitHub token and wait for it to be verified.');
      return;
    }

    try {
      await connect(token, tokenType);
      setToken('');
      setValidatedUser(null);
      setScopes([]);
      onSuccess?.();
      onClose();
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    setToken('');
    setValidatedUser(null);
    setScopes([]);
    setValidationError(null);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[200]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-md"
          onEscapeKeyDown={handleClose}
          onPointerDownOutside={handleClose}
        >
          <motion.div
            className="bg-bolt-elements-background border border-bolt-elements-borderColor rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Connect to GitHub</h2>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-md hover:bg-bolt-elements-item-backgroundActive/10"
                >
                  <div className="i-ph:x w-4 h-4 text-bolt-elements-textSecondary" />
                </button>
              </div>

              <div className="text-xs text-bolt-elements-textSecondary bg-bolt-elements-background-depth-1 p-3 rounded-lg">
                <p className="flex items-center gap-1 mb-1">
                  <span className="i-ph:lightbulb w-3.5 h-3.5 text-bolt-elements-icon-success" />
                  <span className="font-medium">Tip:</span> You need a GitHub token to deploy repositories.
                </p>
                <p>Classic tokens need repo, read:org, and read:user. Fine-grained tokens need repository access and organization access.</p>
              </div>

              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm text-bolt-elements-textSecondary">GitHub token</label>
                    <span className="text-xs text-bolt-elements-textTertiary">
                      Detected: {tokenType === 'classic' ? 'classic' : 'fine-grained'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-bolt-elements-textSecondary mb-2">
                    {tokenType === 'classic' ? 'Personal Access Token' : 'Fine-grained Token'}
                  </label>
                  <input
                    type="password"
                    value={token}
                     onChange={(e) => {
                       const value = e.target.value;
                       setToken(value);
                       setTokenType(detectTokenType(value));
                       setValidatedUser(null);
                       setValidationError(null);
                     }}
                    disabled={isConnecting}
                    placeholder={`Enter your GitHub ${
                      tokenType === 'classic' ? 'personal access token' : 'fine-grained token'
                    }`}
                    className={classNames(
                      'w-full px-3 py-2 rounded-lg text-sm',
                      'bg-bolt-elements-background-depth-1',
                      'border border-bolt-elements-borderColor',
                      'text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary',
                      'focus:outline-none focus:ring-1 focus:ring-bolt-elements-borderColorActive',
                      'disabled:opacity-50',
                    )}
                  />
                  <div className="mt-2 text-sm text-bolt-elements-textSecondary">
                    <a
                      href={`https://github.com/settings/tokens${tokenType === 'fine-grained' ? '/beta' : '/new'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-bolt-elements-borderColorActive hover:underline inline-flex items-center gap-1"
                    >
                      Get your token
                      <div className="i-ph:arrow-square-out w-4 h-4" />
                    </a>
                  </div>
                </div>

                {isValidating && (
                  <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                    <div className="i-ph:spinner-gap animate-spin" />
                    Verifying token with GitHub...
                  </div>
                )}

                {validatedUser && (
                  <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                    <img src={validatedUser.avatar_url} alt="" className="h-9 w-9 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-bolt-elements-textPrimary">
                        {validatedUser.name || validatedUser.login} <span className="font-normal">@{validatedUser.login}</span>
                      </p>
                      <p className="text-xs text-bolt-elements-textSecondary">
                        Granted scopes: {scopes.length > 0 ? scopes.join(', ') : 'GitHub did not report token scopes'}
                      </p>
                    </div>
                  </div>
                )}

                {(validationError || error) && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700">
                    <p className="text-sm text-red-800 dark:text-red-200">{validationError || error}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleOAuth}
                    disabled={isConnecting}
                    className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 border border-bolt-elements-borderColor text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2 disabled:opacity-50"
                  >
                    <div className="i-ph:github-logo w-4 h-4" />
                    Sign in with GitHub
                  </button>
                  <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConnecting || isValidating || !token.trim() || !validatedUser}
                    className={classNames(
                      'px-4 py-2 rounded-lg text-sm flex items-center gap-2',
                      'bg-[#303030] text-white',
                      'hover:bg-[#5E41D0] hover:text-white',
                      'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
                    )}
                  >
                    {isConnecting ? (
                      <>
                        <div className="i-ph:spinner-gap animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <div className="i-ph:plug-charging w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
