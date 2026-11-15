import { loadEnv } from 'vite';

export const POSTHOG_KEY_META = 'posthog-key';
export const POSTHOG_HOST_META = 'posthog-host';

const PROJECT_TOKEN_PATTERN = /^phc_[A-Za-z0-9]+$/;
const HOST_PATTERN = /^(https?:\/\/[^\s"'<>]+|\/[^\s"'<>]*)$/;

const metaTag = (name, content) => ({ tag: 'meta', attrs: { name, content }, injectTo: 'head' });

export const analyticsMetaTags = (env = {}) => {
  const key = (env.POSTHOG_KEY ?? '').trim();
  const host = (env.POSTHOG_HOST ?? '').trim();
  if (!key) return [];
  if (!PROJECT_TOKEN_PATTERN.test(key)) {
    throw new Error(
      'POSTHOG_KEY must be a PostHog project token (phc_…). It is published in index.html, so never use a personal API key.'
    );
  }
  if (host && !HOST_PATTERN.test(host)) {
    throw new Error(
      'POSTHOG_HOST must be a URL such as https://us.i.posthog.com or a path such as /ingest.'
    );
  }
  const tags = [metaTag(POSTHOG_KEY_META, key)];
  if (host) tags.push(metaTag(POSTHOG_HOST_META, host));
  return tags;
};

export const analyticsMeta = () => {
  let tags = [];
  return {
    name: 'analytics-meta',
    configResolved(config) {
      tags = analyticsMetaTags(loadEnv(config.mode, config.envDir || config.root, 'POSTHOG_'));
    },
    transformIndexHtml: () => tags,
  };
};
