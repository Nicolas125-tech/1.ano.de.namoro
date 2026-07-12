const { test, expect } = require('@playwright/test');

test('generatePoem fetches from Gemini and updates DOM', async ({ page }) => {
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
  const mockedPoem = 'Amor eterno que me guia,\nLuz que ilumina meu dia.\nEm teu sorriso encontrei\nO tesouro que sempre busquei.';

  // Navigate to local server
  await page.goto('/');

  const box = page.locator('#poem-box');
  const loader = page.locator('#loader-poem');
  const btn = page.locator('#btn-poem');

  // Verify initial state
  await expect(box).toContainText('Seu poema aparecerá aqui...');
  await expect(loader).toHaveClass(/hidden/);

  let resolveResponse;
  const responsePromise = new Promise(resolve => resolveResponse = resolve);

  await page.route('https://generativelanguage.googleapis.com/v1beta/models/*', async route => {
    const json = {
      candidates: [
        {
          content: {
            parts: [{ text: mockedPoem }]
          }
        }
      ]
    };

    // Wait until we explicitly resolve it
    await responsePromise;
    await route.fulfill({ json });
  });

  // Click the button
  const clickPromise = btn.click();

  // Verify loading state
  await expect(loader).not.toHaveClass(/hidden/);
  await expect(box).toHaveText('Escrevendo versos...');
  await expect(box).toHaveClass(/opacity-50/);

  // Now resolve the API response
  resolveResponse();
  await clickPromise;

  // Verify final state
  // box.innerText replaces \n with empty string without formatting when testing using toHaveText. Let's use toContainText instead.
  await expect(loader).toHaveClass(/hidden/);
  await expect(box).toContainText('Amor eterno que me guia');
  await expect(box).toContainText('Luz que ilumina meu dia');
  await expect(box).not.toHaveClass(/opacity-50/);
});

test('generatePoem handles API error gracefully', async ({ page }) => {
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
  await page.goto('/');

  const box = page.locator('#poem-box');
  const loader = page.locator('#loader-poem');
  const btn = page.locator('#btn-poem');

  // Click the button
  await btn.click();

  // Verify error state
  await expect(loader).toHaveClass(/hidden/);
  await expect(box).toHaveText('O amor é tão grande que travou a IA! ❤️ Tente de novo.');
  await expect(box).not.toHaveClass(/opacity-50/);
});
