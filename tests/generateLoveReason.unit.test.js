/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

describe('generateLoveReason DOM manipulation', () => {
  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = `
      <div id="love-reason-box" class="hidden">Original Text</div>
      <span id="loader-reason" class="hidden"></span>
    `;

    // Extract the function from index.html
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

    // We extract the function body to define it
    const match = html.match(/async function generateLoveReason\(\) \{([\s\S]*?)\n        \}/);
    if (match) {
        // We'll run it in global scope
        global.generateLoveReason = eval(`(async function generateLoveReason() {${match[1]}})`);
    } else {
      throw new Error('generateLoveReason function not found in index.html');
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete global.generateLoveReason;
    delete global.callGemini;
  });

  it('updates DOM correctly during and after API call', async () => {
    let resolveGemini;
    global.callGemini = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        resolveGemini = resolve;
      });
    });

    const box = document.getElementById('love-reason-box');
    const loader = document.getElementById('loader-reason');

    const promise = global.generateLoveReason();

    // Verify intermediate state
    expect(loader.classList.contains('hidden')).toBe(false);
    expect(box.innerText).toBe('Pensando em algo especial...');
    expect(box.classList.contains('opacity-50')).toBe(true);
    expect(global.callGemini).toHaveBeenCalledWith(
        "Você é um assistente romântico. O namorado se chama Nicolas e a namorada Camilly. Eles fazem 1 ano de namoro. Gere UMA frase curta, criativa, romântica e fofa explicando um motivo pelo qual o Nicolas ama a Camilly. Seja específico, fale sobre sorriso, parceria, ou futuro. Apenas a frase. Em Português."
    );

    // Resolve API call
    resolveGemini('O sorriso dela ilumina o meu mundo.');
    await promise;

    // Verify final state
    expect(loader.classList.contains('hidden')).toBe(true);
    expect(box.innerText).toBe('O sorriso dela ilumina o meu mundo.');
    expect(box.classList.contains('opacity-50')).toBe(false);
  });
});
