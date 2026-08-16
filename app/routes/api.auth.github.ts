import { redirect } from '@remix-run/cloudflare';

const getEnv = (context: any, key: string) => context?.cloudflare?.env?.[key] || process.env[key];

export async function loader({ request, context }: { request: Request; context: any }) {
  const clientId = getEnv(context, 'GITHUB_OAUTH_CLIENT_ID');

  if (!clientId) {
    return new Response('GitHub OAuth is not configured. Set GITHUB_OAUTH_CLIENT_ID first.', { status: 503 });
  }

  const state = crypto.randomUUID();
  const callbackUrl = new URL('/api/auth/github/callback', request.url).toString();
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('scope', 'repo read:org read:user');
  authorizeUrl.searchParams.set('state', state);

  return redirect(authorizeUrl.toString(), {
    headers: {
      'Set-Cookie': `github_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${
        new URL(request.url).protocol === 'https:' ? '; Secure' : ''
      }`,
    },
  });
}