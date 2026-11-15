import { appendFileSync } from 'node:fs';
import { createClient, planRollback } from './lib/netlify.mjs';

const token = process.env.NETLIFY_AUTH_TOKEN;
const siteId = process.env.NETLIFY_SITE_ID;
const dryRun = process.env.DRY_RUN === 'true';
const output = (key, value) => process.env.GITHUB_OUTPUT && appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);

if (!token || !siteId) {
  console.log('::warning::NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID is missing; skipping Netlify rollback.');
  output('status', 'skipped');
  process.exit(0);
}

try {
  const plan = await planRollback({ client: createClient({ token }), siteId, dryRun });
  console.log(JSON.stringify(plan, null, 2));
  const status = plan.target ? (plan.restored ? 'restored' : 'dry-run') : 'no-target';
  output('status', status);
  output('target', plan.target?.id ?? '');
  output('target_commit', plan.target?.commit ?? '');
  output('current', plan.current?.id ?? '');
  if (status === 'no-target') console.log('::error::No earlier ready production deploy to restore.');
  process.exit(status === 'no-target' ? 1 : 0);
} catch (error) {
  console.log(`::error::${error.message}`);
  output('status', 'error');
  process.exit(1);
}
