const { test, expect } = require('@playwright/test');

test('generateLoveReason fetches from Gemini and updates DOM', async ({ page }) => {
  // Block external CDNs for reliability
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('google') || url.includes('tailwind') || url.includes('gstatic')) {
      if (!url.includes('generativelanguage.googleapis.com')) {
        return route.abort();
      }
    }
    route.continue();
  });

  // Mock Gemini API
  const mockedReason = 'O sorriso dela ilumina o meu mundo.';

  // Navigate to local server
  await page.addInitScript(() => window.GEMINI_API_KEY = 'mock-api-key');
  await page.goto('/');

  const box = page.locator('#love-reason-box');
  const loader = page.locator('#loader-reason');
  const btn = page.locator('#btn-reason');

  // Verify initial state
  await expect(box).toContainText('Clique no botão abaixo...');
  await expect(loader).toHaveClass(/hidden/);

  // We want to test the loading state, so we intercept the request and delay it
  // Notice we use */models/* to match any model that might be used
  let resolveResponse;
  const responsePromise = new Promise(resolve => resolveResponse = resolve);

  await page.route('https://generativelanguage.googleapis.com/v1beta/models/*', async route => {
    const json = {
      candidates: [
        {
          content: {
            parts: [{ text: mockedReason }]
          }
        }
      ]
    };

    // Wait until we explicitly resolve it
    await responsePromise;
    await route.fulfill({ json });
  });

  // Click the button, but don't await the full resolution yet
  const clickPromise = btn.click();

  // Verify loading state
  // We need to wait for the classes to be applied, so expect(locator).toHaveClass with retry is good
  await expect(loader).not.toHaveClass(/hidden/);
  await expect(box).toHaveText('Pensando em algo especial...');
  await expect(box).toHaveClass(/opacity-50/);

  // Now resolve the API response
  resolveResponse();
  await clickPromise;

  // Verify final state
  await expect(loader).toHaveClass(/hidden/);
  await expect(box).toHaveText(mockedReason);
  await expect(box).not.toHaveClass(/opacity-50/);
});

test('generateLoveReason handles API error gracefully', async ({ page }) => {
  // Block external CDNs for reliability
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('google') || url.includes('tailwind') || url.includes('gstatic')) {
      if (!url.includes('generativelanguage.googleapis.com')) {
        return route.abort();
      }
    }
    route.continue();
  });

  // Mock Gemini API error
  await page.route('https://generativelanguage.googleapis.com/v1beta/models/*', async route => {
    await route.abort('failed');
  });

  // Navigate to local server
  await page.addInitScript(() => window.GEMINI_API_KEY = 'mock-api-key');
  await page.goto('/');

  const box = page.locator('#love-reason-box');
  const loader = page.locator('#loader-reason');
  const btn = page.locator('#btn-reason');

  // Click the button
  await btn.click();

  // Verify error state
  await expect(loader).toHaveClass(/hidden/);
  await expect(box).toHaveText('O amor é tão grande que travou a IA! ❤️ Tente de novo.');
  await expect(box).not.toHaveClass(/opacity-50/);
});
