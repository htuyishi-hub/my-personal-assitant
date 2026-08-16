const getEnv = (context: any, key: string) => context?.cloudflare?.env?.[key] || process.env[key];

const escapeForScript = (value: string) =>
  value.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

const oauthResult = (payload: Record<string, unknown>) => {
  const serialized = escapeForScript(JSON.stringify(payload));

  return new Response(
    `<!doctype html>
      <html><head><title>GitHub sign-in</title></head>
      <body>
        <p>Completing GitHub sign-in…</p>
        <script>
          const payload = ${serialized};
          if (window.opener) {
            window.opener.postMessage(payload, window.location.origin);
            window.close();
          }
        </script>
      </body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
};

const getCookie = (request: Request, name: string) => {
  const cookies = request.headers.get('Cookie') || '';
  return cookies
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
};

export async function loader({ request, context }: { request: Request; context: any }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = getCookie(request, 'github_oauth_state');
  const clientId = getEnv(context, 'GITHUB_OAUTH_CLIENT_ID');
  const clientSecret = getEnv(context, 'GITHUB_OAUTH_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    return oauthResult({ type: 'allable-github-oauth', error: 'GitHub OAuth is not configured on this app.' });
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return oauthResult({ type: 'allable-github-oauth', error: 'GitHub sign-in expired or could not be verified.' });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'AllAble.diy',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: new URL('/api/auth/github/callback', request.url).toString(),
        state,
      }),
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string; error_description?: string };

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'GitHub did not return an access token');
    }

    return oauthResult({
      type: 'allable-github-oauth',
      token: tokenData.access_token,
      tokenType: 'classic',
    });
  } catch (error) {
    return oauthResult({
      type: 'allable-github-oauth',
      error: error instanceof Error ? error.message : 'GitHub sign-in failed',
    });
  }
}