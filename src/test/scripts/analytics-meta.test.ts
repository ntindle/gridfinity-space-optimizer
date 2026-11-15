import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyticsMeta, analyticsMetaTags } from '../../../scripts/lib/analytics-meta.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  tempDirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

const envDir = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'analytics-meta-test-'));
  tempDirs.push(dir);
  Object.entries(files).forEach(([name, content]) => writeFileSync(join(dir, name), content));
  return dir;
};

const keyTag = (content: string) => ({
  tag: 'meta',
  attrs: { name: 'posthog-key', content },
  injectTo: 'head',
});

describe('analyticsMetaTags', () => {
  it('adds nothing without a project token, so analytics stays off', () => {
    expect(analyticsMetaTags({})).toEqual([]);
    expect(analyticsMetaTags({ POSTHOG_KEY: '  ', POSTHOG_HOST: 'https://eu.i.posthog.com' })).toEqual([]);
  });

  it('writes the token and host into meta tags', () => {
    expect(
      analyticsMetaTags({ POSTHOG_KEY: ' phc_demo ', POSTHOG_HOST: ' https://eu.i.posthog.com ' })
    ).toEqual([
      keyTag('phc_demo'),
      { tag: 'meta', attrs: { name: 'posthog-host', content: 'https://eu.i.posthog.com' }, injectTo: 'head' },
    ]);
  });

  it('leaves the host out when none is set', () => {
    expect(analyticsMetaTags({ POSTHOG_KEY: 'phc_demo' })).toEqual([keyTag('phc_demo')]);
  });

  it('accepts a reverse-proxy path as the host', () => {
    expect(analyticsMetaTags({ POSTHOG_KEY: 'phc_demo', POSTHOG_HOST: '/ingest' })).toHaveLength(2);
  });

  it.each(['phx_personalapikey', 'phs_securekey', 'sk_live_123', 'phc_has spaces', 'phc_"><script>'])(
    'refuses %s because only a project token may be published',
    (key) => {
      expect(() => analyticsMetaTags({ POSTHOG_KEY: key })).toThrow(/project token/);
    }
  );

  it('refuses a host that is neither a URL nor a path', () => {
    expect(() =>
      analyticsMetaTags({ POSTHOG_KEY: 'phc_demo', POSTHOG_HOST: 'us.i.posthog.com' })
    ).toThrow(/POSTHOG_HOST/);
  });
});

describe('analyticsMeta plugin', () => {
  it('reads POSTHOG_ variables from the env files Vite loads and ignores VITE_ ones', () => {
    const dir = envDir({
      '.env.production.local': 'POSTHOG_KEY=phc_file\nVITE_POSTHOG_KEY=phc_vite\n',
    });
    const plugin = analyticsMeta();
    plugin.configResolved({ mode: 'production', envDir: dir, root: dir });

    expect(plugin.transformIndexHtml()).toEqual([keyTag('phc_file')]);
  });

  it('adds nothing to index.html when no key is configured', () => {
    const dir = envDir({ '.env': 'VITE_POSTHOG_KEY=phc_vite\n' });
    const plugin = analyticsMeta();
    plugin.configResolved({ mode: 'production', envDir: dir, root: dir });

    expect(plugin.transformIndexHtml()).toEqual([]);
  });
});
