import { redirect } from '@remix-run/cloudflare';

export const loader = () => redirect('/chat/default');

export default function OnboardRedirect() {
  return null;
}
