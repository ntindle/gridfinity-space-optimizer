import { chromium } from '@playwright/test';

const url = process.argv[2] ?? process.env.SMOKE_URL ?? 'https://gridfinitylayout.com/';
const pieces = (page) =>
  page.$$eval('button', (bs) =>
    bs.map((b) => b.textContent.trim()).filter((t) => /^(Baseplate|Spacer|Bin)\b/.test(t)),
  );

const checks = [];
const check = async (name, fn) => {
  const t0 = Date.now();
  try {
    await fn();
    checks.push({ name, ok: true, ms: Date.now() - t0 });
  } catch (error) {
    checks.push({ name, ok: false, ms: Date.now() - t0, error: String(error).slice(0, 300) });
  }
};

const browser = await chromium.launch();
const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

await check('loads', async () => {
  const res = await page.goto(url, { waitUntil: 'networkidle' });
  if (!res?.ok()) throw new Error(`status ${res?.status()}`);
  await page.waitForSelector('#drawerWidth', { timeout: 15000 });
});

await check('layout from drawer and printer', async () => {
  await page.fill('#drawerWidth', '20');
  await page.fill('#drawerHeight', '15');
  await page.getByRole('combobox').first().click();
  await page.getByRole('option').nth(1).click();
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => /^Baseplate\b/.test(b.textContent.trim())),
    null,
    { timeout: 10000 },
  );
});

await check('adjusting the grid updates the preview', async () => {
  const before = (await pieces(page)).join('|');
  await page.fill('#drawerWidth', '26');
  await page.press('#drawerWidth', 'Tab');
  await page.waitForFunction(
    (prev) =>
      [...document.querySelectorAll('button')]
        .map((b) => b.textContent.trim())
        .filter((t) => /^(Baseplate|Spacer|Bin)\b/.test(t))
        .join('|') !== prev,
    before,
    { timeout: 10000 },
  );
});

await check('share link round-trips', async () => {
  await page.getByRole('button', { name: /share link/i }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  if (!link.includes('share=')) throw new Error(`no share param in ${link}`);
  const expected = (await pieces(page)).join('|');
  const other = await context.newPage();
  await other.goto(link, { waitUntil: 'networkidle' });
  await other.waitForSelector('#drawerWidth');
  const actual = (await pieces(other)).join('|');
  if (actual !== expected) throw new Error('shared layout differs from source layout');
});

await check('no uncaught page errors', async () => {
  if (pageErrors.length) throw new Error(pageErrors.join('; '));
});

await browser.close();
console.log(JSON.stringify({ url, checks }, null, 2));
if (checks.some((c) => !c.ok)) process.exit(1);
