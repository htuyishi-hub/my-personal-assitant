import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';

export const meta: MetaFunction = () => {
  return [{ title: 'allAble' }, { name: 'description', content: 'Talk with allAble, an AI assistant' }];
};

export const loader = () => json({});

export default function Index() {
  return (
    <ClientOnly>
      {() => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40 }}>
          <img src="/logo-allable.svg" alt="allAble" style={{ width: 240, marginBottom: 24 }} />
          <h1 style={{ marginBottom: 12 }}>Welcome to allAble</h1>
          <p style={{ maxWidth: 560, textAlign: 'center', marginBottom: 18 }}>
            Build Smart. Grow Fast. Turn ideas into websites and apps — no coding needed.
          </p>
          <a href="/chat/default" style={{ padding: '10px 18px', background: '#0b69ff', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
            Enter the Lab
          </a>
        </div>
      )}
    </ClientOnly>
  );
}
