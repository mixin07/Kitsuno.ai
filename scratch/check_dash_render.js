const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\jeyav\\.gemini\\antigravity\\brain\\ed7979cd-00c6-4a96-a0ac-81c8a8a0dbfe';
const STUDENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDIyIiwiZXhwIjoxNzg5OTQzMDYzfQ.oygG5UU38nrIeUbmjGthPq79awHfNaTDRu0IJgQd7Rw';

async function run() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--user-data-dir=C:\\Users\\jeyav\\AppData\\Local\\Temp\\chrome-dash-student-' + Date.now(),
    '--no-first-run',
    'http://localhost:5173/'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const res = await fetch('http://127.0.0.1:9230/json');
  const targets = await res.json();
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('5173'));
  
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const reqId = id++;
    ws.addEventListener('message', function handler(ev) {
      const msg = JSON.parse(ev.data);
      if (msg.id === reqId) { ws.removeEventListener('message', handler); res(msg.result); }
    });
    ws.send(JSON.stringify({ id: reqId, method, params }));
  });
  
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });

  // Set student token
  await send('Runtime.evaluate', { expression: `localStorage.setItem('access_token', '${STUDENT_TOKEN}')` });
  
  // Navigate to /student
  await send('Page.navigate', { url: 'http://localhost:5173/student' });
  await new Promise(r => setTimeout(r, 3000));
  
  const loc = await send('Runtime.evaluate', { expression: 'window.location.href' });
  const text = await send('Runtime.evaluate', { expression: 'document.body.innerText' });
  console.log('Location:', loc.result.value);
  console.log('Student text length:', text.result.value.length);
  console.log('Student text preview:\n', text.result.value.slice(0, 600));
  
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(ARTIFACT_DIR, 'current_student_view.png'), Buffer.from(snap.data, 'base64'));
  console.log('Screenshot saved to current_student_view.png');

  chromeProc.kill();
}
run().catch(console.error);
