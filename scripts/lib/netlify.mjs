export const API = 'https://api.netlify.com/api/v1';

export const pickRestoreTarget = (deploys, published) => {
  if (!published?.id) return null;
  const publishedAt = Date.parse(published.created_at);
  const candidates = deploys
    .filter((d) => d.id !== published.id && d.state === 'ready' && d.context === 'production')
    .filter((d) => Number.isNaN(publishedAt) || Date.parse(d.created_at) < publishedAt)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return candidates[0] ?? null;
};

export const summarizeDeploy = (d) =>
  d && { id: d.id, commit: d.commit_ref ?? null, created_at: d.created_at, title: d.title ?? null };

export const createClient = ({ token, fetchImpl = fetch }) => {
  const call = async (method, path) => {
    const res = await fetchImpl(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Netlify ${method} ${path} failed: ${res.status} ${await res.text()}`);
    return res.json();
  };
  return {
    user: () => call('GET', '/user'),
    site: (siteId) => call('GET', `/sites/${siteId}`),
    productionDeploys: (siteId) => call('GET', `/sites/${siteId}/deploys?production=true&state=ready&per_page=20`),
    restore: (siteId, deployId) => call('POST', `/sites/${siteId}/deploys/${deployId}/restore`),
  };
};

export const planRollback = async ({ client, siteId, dryRun }) => {
  const user = await client.user();
  const site = await client.site(siteId);
  const published = site.published_deploy;
  const deploys = await client.productionDeploys(siteId);
  const target = pickRestoreTarget(deploys, published);
  const plan = { site: site.name, authenticatedAs: user.email ?? user.id ?? 'unknown', dryRun, current: summarizeDeploy(published), target: summarizeDeploy(target), restored: false };
  if (!target || dryRun) return plan;
  await client.restore(siteId, target.id);
  return { ...plan, restored: true };
};
