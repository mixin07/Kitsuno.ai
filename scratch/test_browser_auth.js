const { spawn } = require('child_process');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDIyIiwiZXhwIjoxNzg5OTQzMDYzfQ.oygG5UU38nrIeUbmjGthPq79awHfNaTDRu0IJgQd7Rw';

async function test() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--user-data-dir=C:\\Users\\jeyav\\AppData\\Local\\Temp\\chrome-debug-auth-test',
    '--no-first-run',
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9225/json');
  const targets = await listRes.json();
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise(res => {
    const reqId = id++;
    const onMsg = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === reqId) {
        ws.removeEventListener('message', onMsg);
        res(msg.result);
      }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id: reqId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('BROWSER CONSOLE:', msg.params.args.map(a => a.value || a.description));
    }
  });

  // Navigate to /
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1500));

  // Set token
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('access_token', '${TOKEN}')`
  });

  // Reload the page at /student
  await send('Page.navigate', { url: 'http://localhost:5173/student' });
  await new Promise(r => setTimeout(r, 3000));

  const loc = await send('Runtime.evaluate', { expression: 'window.location.href' });
  const body = await send('Runtime.evaluate', { expression: 'document.body.innerText' });
  console.log('FINAL LOCATION:', loc.result.value);
  console.log('FINAL BODY (first 600 chars):\n', body.result.value.slice(0, 600));

  ws.close();
  chromeProc.kill();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
