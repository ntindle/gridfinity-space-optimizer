import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { measureParity as scoreParity } from './lib/parity.mjs';
import { startPreviewServer, stopPreviewServer } from './lib/preview-server.mjs';
import { PIECE_LABEL_PATTERN } from './lib/piece-labels.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const N = Number(args.n ?? 15);
const LH_RUNS = Number(args.lh ?? 3);
const externalUrl = args.url;
const PORT = 4173;
const url = externalUrl ?? `http://localhost:${PORT}/`;

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

const pieceSignature = (page) =>
  page.$$eval(
    'button',
    (bs, patternSource) =>
      bs.map((b) => b.textContent.trim()).filter((t) => new RegExp(patternSource).test(t)).join('|'),
    PIECE_LABEL_PATTERN.source,
  );

const timeUntilPreviewChanges = async (page, action) => {
  await page.evaluate((patternSource) => {
    window.__previewChangedAt = null;
    const read = () =>
      [...document.querySelectorAll('button')]
        .map((b) => b.textContent.trim())
        .filter((t) => new RegExp(patternSource).test(t))
        .join('|');
    const before = read();
    const observer = new MutationObserver(() => {
      if (window.__previewChangedAt === null && read() !== before) {
        window.__previewChangedAt = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    window.__actionAt = performance.now();
  }, PIECE_LABEL_PATTERN.source);
  await action();
  await page.waitForFunction(() => window.__previewChangedAt !== null, null, { timeout: 10000 });
  return page.evaluate(() => window.__previewChangedAt - window.__actionAt);
};

const setInput = async (page, selector, value, steps) => {
  await page.fill(selector, String(value));
  steps.count += 1;
};

const measureInteractions = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const tasks = {};

  const fresh = async () => {
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.goto(url);
    await page.waitForSelector('#drawerWidth');
  };

  const layoutTimes = [];
  let layoutSteps = 0;
  for (let i = 0; i < N; i += 1) {
    await fresh();
    const steps = { count: 0 };
    const t0 = Date.now();
    await setInput(page, '#drawerWidth', 20 + (i % 5), steps);
    await setInput(page, '#drawerHeight', 15 + (i % 3), steps);
    await page.getByRole('combobox').first().click();
    steps.count += 1;
    await page.getByRole('option').nth(1 + (i % 3)).click();
    steps.count += 1;
    await page.waitForFunction(
      (patternSource) =>
        [...document.querySelectorAll('button')].some((b) => new RegExp(patternSource).test(b.textContent.trim())),
      PIECE_LABEL_PATTERN.source,
      { timeout: 10000 },
    );
    layoutTimes.push(Date.now() - t0);
    layoutSteps = steps.count;
  }
  tasks.layout = { steps: layoutSteps, medianMs: round(median(layoutTimes)), supported: true };

  await fresh();
  const previewTimes = [];
  for (let i = 0; i < N; i += 1) {
    const value = i % 2 ? '26' : '18';
    const editWidth = async () => {
      await page.fill('#drawerWidth', value);
      await page.press('#drawerWidth', 'Tab');
    };
    previewTimes.push(await timeUntilPreviewChanges(page, editWidth));
  }
  tasks.adjustGrid = { steps: 1, medianMs: round(median(previewTimes)), supported: true };

  await fresh();
  const exportControl = page.getByRole('button', { name: /export|download|stl|3mf|print list/i });
  tasks.export = { steps: null, medianMs: null, supported: (await exportControl.count()) > 0 };

  const shareTimes = [];
  for (let i = 0; i < N; i += 1) {
    await fresh();
    const t0 = Date.now();
    await page.getByRole('button', { name: /share link/i }).click();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    if (!link.includes('share=')) throw new Error(`share link missing share param: ${link}`);
    shareTimes.push(Date.now() - t0);
  }
  tasks.share = { steps: 1, medianMs: round(median(shareTimes)), supported: true };

  const signature = await pieceSignature(page);
  await browser.close();
  return { tasks, previewPieces: signature === '' ? 0 : signature.split('|').length };
};

const measureLighthouse = async () => {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const perf = [];
  const tti = [];
  try {
    for (let i = 0; i < LH_RUNS; i += 1) {
      const result = await lighthouse(url, { port: chrome.port, onlyCategories: ['performance'], output: 'json', logLevel: 'error' });
      perf.push(result.lhr.categories.performance.score * 100);
      tti.push(result.lhr.audits.interactive.numericValue);
    }
  } finally {
    await chrome.kill();
  }
  return { perfScore: round(median(perf), 0), ttiMs: round(median(tti), 0), runs: LH_RUNS };
};

const measureParity = () => {
  const path = 'docs/feature-map.md';
  if (!existsSync(path)) return null;
  return scoreParity(readFileSync(path, 'utf8'));
};

const server = externalUrl ? null : await startPreviewServer({ port: PORT });
try {
  const interactions = await measureInteractions();
  const lh = await measureLighthouse();
  const report = {
    measuredAt: new Date().toISOString(),
    url,
    n: N,
    parity: measureParity(),
    lighthouse: lh,
    ...interactions,
  };
  mkdirSync('measurements', { recursive: true });
  writeFileSync('measurements/latest.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await stopPreviewServer(server);
}
