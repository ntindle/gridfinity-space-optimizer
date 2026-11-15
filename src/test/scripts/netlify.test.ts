import { describe, it, expect, vi } from 'vitest';
import { pickRestoreTarget, planRollback, createClient, summarizeDeploy } from '../../../scripts/lib/netlify.mjs';

const deploy = (id: string, created_at: string, extra: Record<string, unknown> = {}) => ({
  id,
  created_at,
  state: 'ready',
  context: 'production',
  commit_ref: `sha-${id}`,
  ...extra,
});

describe('pickRestoreTarget', () => {
  const published = deploy('d3', '2026-10-14T13:00:00Z');

  it('picks the newest ready production deploy older than the published one', () => {
    const deploys = [deploy('d4', '2026-10-14T14:00:00Z'), published, deploy('d2', '2026-10-14T12:00:00Z'), deploy('d1', '2026-10-14T11:00:00Z')];
    expect(pickRestoreTarget(deploys, published)?.id).toBe('d2');
  });

  it('skips failed, preview, and branch deploys', () => {
    const deploys = [
      deploy('err', '2026-10-14T12:30:00Z', { state: 'error' }),
      deploy('prev', '2026-10-14T12:20:00Z', { context: 'deploy-preview' }),
      deploy('ok', '2026-10-14T12:10:00Z'),
    ];
    expect(pickRestoreTarget(deploys, published)?.id).toBe('ok');
  });

  it('returns null when nothing older exists or nothing is published', () => {
    expect(pickRestoreTarget([published], published)).toBeNull();
    expect(pickRestoreTarget([deploy('a', '2026-01-01T00:00:00Z')], null)).toBeNull();
  });

  it('handles a published deploy without a timestamp', () => {
    const deploys = [deploy('a', '2026-10-14T10:00:00Z'), deploy('b', '2026-10-14T11:00:00Z')];
    expect(pickRestoreTarget(deploys, { id: 'x' })?.id).toBe('b');
  });
});

describe('summarizeDeploy', () => {
  it('keeps id, commit, time, and title', () => {
    expect(summarizeDeploy(deploy('a', 't', { title: 'T' }))).toEqual({ id: 'a', commit: 'sha-a', created_at: 't', title: 'T' });
    expect(summarizeDeploy({ id: 'b', created_at: 't' })).toEqual({ id: 'b', commit: null, created_at: 't', title: null });
  });
});

const fakeClient = (restore = vi.fn(async () => ({}))) => ({
  user: vi.fn(async () => ({ email: 'me@example.com' })),
  site: vi.fn(async () => ({ name: 'site', published_deploy: deploy('d3', '2026-10-14T13:00:00Z') })),
  productionDeploys: vi.fn(async () => [deploy('d3', '2026-10-14T13:00:00Z'), deploy('d2', '2026-10-14T12:00:00Z')]),
  restore,
});

describe('planRollback', () => {
  it('resolves the target without restoring on dry run', async () => {
    const client = fakeClient();
    const plan = await planRollback({ client, siteId: 's', dryRun: true });
    expect(plan.target?.id).toBe('d2');
    expect(plan.restored).toBe(false);
    expect(plan.authenticatedAs).toBe('me@example.com');
    expect(client.restore).not.toHaveBeenCalled();
  });

  it('fails before touching deploys when the token is rejected', async () => {
    const client = { ...fakeClient(), user: vi.fn(async () => { throw new Error('Netlify GET /user failed: 401'); }) };
    await expect(planRollback({ client, siteId: 's', dryRun: true })).rejects.toThrow('401');
    expect(client.site).not.toHaveBeenCalled();
    expect(client.restore).not.toHaveBeenCalled();
  });

  it('falls back to the user id when there is no email', async () => {
    const client = { ...fakeClient(), user: vi.fn(async () => ({ id: 'u1' })) };
    expect((await planRollback({ client, siteId: 's', dryRun: true })).authenticatedAs).toBe('u1');
  });

  it('restores the target when not a dry run', async () => {
    const client = fakeClient();
    const plan = await planRollback({ client, siteId: 's', dryRun: false });
    expect(client.restore).toHaveBeenCalledWith('s', 'd2');
    expect(plan.restored).toBe(true);
  });

  it('does not restore when there is no target', async () => {
    const client = { ...fakeClient(), productionDeploys: vi.fn(async () => []) };
    const plan = await planRollback({ client, siteId: 's', dryRun: false });
    expect(plan.target).toBeNull();
    expect(client.restore).not.toHaveBeenCalled();
  });
});

describe('createClient', () => {
  it('sends the bearer token and the documented restore path', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    await createClient({ token: 'tok', fetchImpl }).restore('site1', 'dep1');
    expect(fetchImpl).toHaveBeenCalledWith('https://api.netlify.com/api/v1/sites/site1/deploys/dep1/restore', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok' },
    });
  });

  it('throws with status on failure', async () => {
    const fetchImpl = vi.fn(async () => new Response('nope', { status: 401 }));
    await expect(createClient({ token: 't', fetchImpl }).site('s')).rejects.toThrow('401 nope');
  });

  it('lists ready production deploys', async () => {
    const fetchImpl = vi.fn(async () => new Response('[]', { status: 200 }));
    await createClient({ token: 't', fetchImpl }).productionDeploys('s');
    expect(fetchImpl).toHaveBeenCalledWith('https://api.netlify.com/api/v1/sites/s/deploys?production=true&state=ready&per_page=20', expect.anything());
  });
});
