import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9245;
const BASE_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\jeyav\\.gemini\\antigravity\\brain\\ed7979cd-00c6-4a96-a0ac-81c8a8a0dbfe';

async function main() {
  console.log('=== VERIFYING BALANCED CURSOR GRID ===');

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
      console.log(`[Captured Screenshot] ${filename}`);
    }

    console.log('Loading landing page...');
    await send('Page.navigate', { url: BASE_URL });
    await new Promise(r => setTimeout(r, 4800));

    async function testSectionCursor(selector, name, cursorX = 640, cursorY = 480) {
      console.log(`Testing cursor on ${name}...`);
      await evaluate(`
        (() => {
          const el = document.querySelector('${selector}');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `);
      await new Promise(r => setTimeout(r, 400));

      // Dispatch mouse move event to activate cursor grid
      await evaluate(`
        (() => {
          window.dispatchEvent(new PointerEvent('pointermove', {
            clientX: ${cursorX},
            clientY: ${cursorY},
            bubbles: true
          }));
        })()
      `);
      await new Promise(r => setTimeout(r, 120));

      // Capture screenshot while active
      await screenshot(`balanced_grid_${name}.png`);
    }

    // Test across all required sections
    await testSectionCursor('#problem', 'problem', 450, 400);
    await testSectionCursor('#solution', 'solution', 640, 500);
    await testSectionCursor('#approach', 'how_it_works', 500, 450);
    await testSectionCursor('#features', 'features', 640, 400);
    await testSectionCursor('.ks-showcase', 'product', 640, 450);
    await testSectionCursor('#start', 'final_cta', 640, 420);
    await testSectionCursor('footer', 'footer', 640, 700);

    console.log('=== ALL BALANCED CURSOR SCREENSHOTS CAPTURED ===');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
  }
}

main();
