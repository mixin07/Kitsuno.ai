import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9242;
const BASE_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\jeyav\\.gemini\\antigravity\\brain\\ed7979cd-00c6-4a96-a0ac-81c8a8a0dbfe';

async function main() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1280,960'
  ]);

  await new Promise(r => setTimeout(r, 1400));

  try {
    const list = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/json`, res => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => resolve(JSON.parse(raw)));
      }).on('error', reject);
    });

    const page = list.find(t => t.type === 'page');
    if (!page) throw new Error('No page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        function onMsg(ev) {
          const msg = JSON.parse(ev.data);
          if (msg.id === id) {
            ws.removeEventListener('message', onMsg);
            resolve(msg.result);
          }
        }
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Runtime.enable');
    await send('Page.enable');

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res?.result?.value;
    }

    async function screenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filepath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log(`[Captured] ${filename}`);
    }

    await send('Page.navigate', { url: BASE_URL });
    // Wait for the full intro to complete (4.6s)
    console.log('Waiting for intro to complete...');
    await new Promise(r => setTimeout(r, 4800));

    // 1. Approach to Features
    await evaluate(`document.querySelector('#approach').scrollIntoView({ behavior: 'instant', block: 'center' });`);
    await new Promise(r => setTimeout(r, 600));
    await screenshot('part14_09_revealed_approach_to_features.png');

    // 2. Features Card
    await evaluate(`document.querySelector('#features').scrollIntoView({ behavior: 'instant', block: 'start' });`);
    await new Promise(r => setTimeout(r, 600));
    await screenshot('part14_10_features_card.png');

    // 3. Product Showcase to Final CTA transition
    await evaluate(`document.querySelector('.ks-showcase').scrollIntoView({ behavior: 'instant', block: 'center' });`);
    await new Promise(r => setTimeout(r, 600));
    await screenshot('part14_11_product_showcase.png');

    await evaluate(`document.querySelector('#start').scrollIntoView({ behavior: 'instant', block: 'start' });`);
    await new Promise(r => setTimeout(r, 600));
    await screenshot('part14_12_cta_chapter_start.png');

    // 4. Test subtle cursor movement on CTA
    await evaluate(`
      (() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 640, clientY: 500 }));
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    await screenshot('part14_13_subtle_cursor_grid_active.png');

    console.log('All revealed section screenshots captured!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

main();
