import { test, expect } from '@playwright/test';

// Regression test for the teacher-manual Paged.js hang (Track B, Phase 9.4):
// the compiled manual must paginate (`.pagedjs_page` count grows) and reach a
// stable count > 50 within a generous timeout. Previously the render could
// freeze at a low page count with the main thread idle when rAF was dropped
// (background-tab throttling), because Paged.js drives pagination through a
// fragile requestAnimationFrame callback chain.
test.describe('Teacher Manual Paged.js Rendering', () => {
  test('compiled teacher manual paginates to a stable page count > 50', async ({ page }) => {
    test.setTimeout(120000);

    const res = await page.request.get('/api/projects/origins-2-a0/teacher-manual');
    expect(res.ok()).toBeTruthy();
    const { html, lessonCount } = await res.json();
    expect(lessonCount).toBe(14);
    expect(html).toContain('paged.polyfill.js');
    expect(html.length).toBeGreaterThan(100000);

    await page.setContent(html);

    // The polyfill moves body content into a template and creates .pagedjs_pages.
    await expect(page.locator('.pagedjs_pages')).toBeVisible({ timeout: 30000 });

    // Page count must grow past 50 (the full manual is ~160-210 pages).
    await expect
      .poll(async () => page.locator('.pagedjs_page').count(), { timeout: 90000 })
      .toBeGreaterThan(50);

    // Once the count exceeds 50, confirm it stays stable (no regression to a freeze).
    const count = await page.locator('.pagedjs_page').count();
    await page.waitForTimeout(5000);
    const after = await page.locator('.pagedjs_page').count();
    expect(after).toBeGreaterThanOrEqual(count);
    expect(after).toBeGreaterThan(50);
  });

  test('paginates even when native rAF silently drops every frame while visible', async ({ page }) => {
    test.setTimeout(120000);

    const res = await page.request.get('/api/projects/origins-2-a0/teacher-manual');
    expect(res.ok()).toBeTruthy();
    const { html } = await res.json();

    // Install a frame-starvation shim BEFORE the wrapper's rAF shim. The
    // wrapper captures this dropper as its "native" rAF, which never delivers
    // a callback even though visibilityState stays "visible" — reproducing the
    // occluded-tab freeze seen in real Chrome. Pagination must still complete
    // via the wrapper's setTimeout(0) fallback.
    const starved = html.replace(
      '<head>',
      '<head><script>' +
        'window.requestAnimationFrame = function () { return 1; };' +
        'window.cancelAnimationFrame = function () {};' +
        '</script>'
    );
    expect(starved).not.toBe(html);

    await page.setContent(starved);
    await expect(page.locator('.pagedjs_pages')).toBeVisible({ timeout: 30000 });
    await expect
      .poll(async () => page.locator('.pagedjs_page').count(), { timeout: 90000 })
      .toBeGreaterThan(50);
  });

  test('paginates when the tab is hidden mid-render and then shown again', async ({ page }) => {
    test.setTimeout(120000);

    const res = await page.request.get('/api/projects/origins-2-a0/teacher-manual');
    expect(res.ok()).toBeTruthy();
    const { html } = await res.json();

    // Force the page to start "hidden" (background tab) with a test hook to
    // flip visibility back. The shim queues rAF callbacks while hidden and
    // must flush them immediately on visibilitychange.
    const hiddenFirst = html.replace(
      '<head>',
      '<head><script>' +
        'window.__tmHidden = true;' +
        "Object.defineProperty(document, 'visibilityState', { configurable: true, get: function () { return window.__tmHidden ? 'hidden' : 'visible'; } });" +
        '</script>'
    );

    await page.setContent(hiddenFirst);
    await expect(page.locator('.pagedjs_pages')).toBeVisible({ timeout: 30000 });

    // Let the queued (hidden) path run for a moment, then bring the tab back.
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      const w = window as unknown as { __tmHidden: boolean };
      w.__tmHidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect
      .poll(async () => page.locator('.pagedjs_page').count(), { timeout: 90000 })
      .toBeGreaterThan(50);
  });
});
