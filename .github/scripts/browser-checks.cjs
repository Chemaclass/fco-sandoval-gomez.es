// Run after zola build. No requests are sent to the production website.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(process.argv[2] || 'public');
const types = { '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon' };
function asset(url) {
  let file = path.join(root, decodeURIComponent(new URL(url).pathname));
  if (!file.startsWith(root + path.sep)) file = path.join(root, 'index.html');
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return file;
}
const server = http.createServer((req, res) => {
  const file = asset(`http://localhost${req.url}`);
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  if (fs.existsSync(file)) res.end(fs.readFileSync(file)); else { res.statusCode = 404; res.end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || undefined });
  const errors = [];
  async function context(options = {}) {
    const ctx = await browser.newContext({ reducedMotion: 'reduce', ...options });
    // Absolute asset URLs are served from this build; third parties are blocked.
    await ctx.route('https://**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname === 'fco-sandoval-gomez.es') {
        const file = asset(url);
        if (fs.existsSync(file)) return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
      }
      return route.abort();
    });
    ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    return ctx;
  }
  try {
    const desktop = await context({ viewport: { width: 1440, height: 1000 } });
    const page = await desktop.newPage();
    let indexes = 0;
    page.on('request', req => { if (req.url().includes('search_index')) indexes++; });
    await page.goto(origin, { waitUntil: 'networkidle' });
    assert.equal(indexes, 0, 'Search index must not download until search opens');
    await page.keyboard.press('d');
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('theme-dark')), false, 'Single-letter shortcuts default to disabled');
    await page.locator('.search-toggle').click();
    await page.locator('#search-input').fill('caravaca');
    await page.waitForFunction(() => document.querySelectorAll('.search-result-item').length > 1);
    await page.keyboard.press('ArrowDown');
    const first = await page.locator('.search-result-item:focus').getAttribute('href');
    await page.keyboard.press('ArrowDown');
    assert.notEqual(await page.locator('.search-result-item:focus').getAttribute('href'), first, 'Arrow navigation must continue after leaving the input');
    await page.keyboard.press('Escape');
    assert(await page.locator('.search-toggle').evaluate(el => el === document.activeElement));
    await page.locator('.search-toggle').click();
    await page.locator('#search-input').fill('acustica');
    await page.waitForFunction(() => document.querySelector('.search-result-title')?.textContent.toLowerCase().includes('acústica'));
    assert.equal(indexes, 1, 'Reopening search reuses its index');
    await page.keyboard.press('Escape');
    await page.locator('.help-toggle').click();
    assert(await page.locator('#help-modal').evaluate(el => el.open));
    await page.locator('#enable-shortcuts').check();
    await page.keyboard.press('Escape');
    assert(await page.locator('.help-toggle').evaluate(el => el === document.activeElement));
    await page.keyboard.press('d');
    assert(await page.locator('html').evaluate(el => el.classList.contains('theme-dark')));

    await page.goto(origin + '/articulos/arquitectura-pluribus/', { waitUntil: 'networkidle' });
    const imageButton = page.locator('.image-trigger').first();
    await imageButton.focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('#lightbox').evaluate(el => el.open));
    await page.keyboard.press('ArrowRight');
    assert.match(await page.locator('#lightbox-counter').textContent(), /^2 \/ /);
    await page.keyboard.press('Escape');
    assert(await imageButton.evaluate(el => el === document.activeElement));

    const mobile = await context({ viewport: { width: 390, height: 844 } });
    const phone = await mobile.newPage();
    await phone.goto(origin, { waitUntil: 'networkidle' });
    assert.equal(await phone.locator('.articles-section .posts-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length), 1);
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert(await phone.locator('.logo-photo').evaluate(el => el.naturalWidth === 88));
    assert(await phone.locator('.hero-background img').evaluate(el => el.currentSrc.includes('processed_images')));
    await phone.locator('.menu-toggle').click();
    await phone.keyboard.press('Escape');
    assert.equal(await phone.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');

    const noJS = await context({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await noJS.newPage();
    await staticPage.goto(origin + '/trabajos/', { waitUntil: 'networkidle' });
    assert.equal(await staticPage.locator('.img-skeleton img').first().evaluate(el => getComputedStyle(el).opacity), '1');

    const failure = await context();
    const errorPage = await failure.newPage();
    await errorPage.route('**/search_index*', route => route.abort());
    await errorPage.goto(origin, { waitUntil: 'networkidle' });
    await errorPage.locator('.search-toggle').click();
    await errorPage.waitForFunction(() => document.querySelector('#search-status').textContent.includes('No se pudo'));

    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await phone.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'mobile.png'), fullPage: true });
      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'desktop-dark.png'), fullPage: true });
    }
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log('Browser checks passed: search, dialogs, shortcuts, mobile, responsive images, no-JS images, loading failure.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
