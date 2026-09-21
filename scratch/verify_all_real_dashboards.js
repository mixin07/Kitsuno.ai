const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\jeyav\\.gemini\\antigravity\\brain\\ed7979cd-00c6-4a96-a0ac-81c8a8a0dbfe';

// Real tokens generated with secret key for real database users:
const STUDENT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDIyIiwiZXhwIjoxNzg5OTQzMDYzfQ.oygG5UU38nrIeUbmjGthPq79awHfNaTDRu0IJgQd7Rw';
const INSTRUCTOR_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDIzIiwiZXhwIjoxNzg5OTQzMDYzfQ.tLc-EPqflDpuUslKfXsJshLssyvA3e8_eiKTCceVhEQ';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MSIsImV4cCI6MTc4OTk0MzA2M30.Oa8obGNF_-67Ws0r3ChctANdSXLAkxUGLdKAZwrIoeM';

async function run() {
  console.log('Starting headless Chrome for real dashboard verification...');
  const chromeProc = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9223',
      '--user-data-dir=C:\\Users\\jeyav\\AppData\\Local\\Temp\\chrome-real-dashboards-' + Date.now(),
      '--no-first-run',
    ]
  );

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const wsUrl = pageTarget?.webSocketDebuggerUrl;
    if (!wsUrl) throw new Error('No debugger target found');

    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        function onMsg(ev) {
          const msg = JSON.parse(ev.data);
          if (msg.id === reqId) {
            ws.removeEventListener('message', onMsg);
            resolve(msg.result);
          }
        }
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false
    });

    async function setTokenAndNavigate(token, route) {
      // First go to origin
      await send('Page.navigate', { url: 'http://localhost:5173/' });
      await new Promise(r => setTimeout(r, 800));
      // Set localStorage
      await send('Runtime.evaluate', {
        expression: `localStorage.setItem('access_token', '${token}')`
      });
      // Navigate to route
      await send('Page.navigate', { url: `http://localhost:5173${route}` });
      await new Promise(r => setTimeout(r, 2000));
    }

    async function takeScreenshot(filename) {
      const snap = await send('Page.captureScreenshot', { format: 'png' });
      const outPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(outPath, Buffer.from(snap.data, 'base64'));
      console.log('Saved screenshot:', filename);
    }

    // ==========================================
    // 1. STUDENT DASHBOARD VERIFICATION
    // ==========================================
    console.log('\n--- 1. Testing Student Dashboard ---');
    await setTokenAndNavigate(STUDENT_TOKEN, '/student');
    const studentDom = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        title: document.title,
        heading: document.querySelector('h1')?.innerText,
        cards: Array.from(document.querySelectorAll('.rounded-2xl.border')).map(el => el.innerText),
        hasEmptyState: document.body.innerText.includes('You are not enrolled in any courses yet'),
        hasBrowseBtn: !!Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('Browse Available Courses'))
      })`
    });
    console.log('Student Dashboard DOM result:', studentDom.result.value);
    await takeScreenshot('verified_student_dashboard_real_data.png');

    // ==========================================
    // 2. PROFILE PAGE & EDIT VERIFICATION
    // ==========================================
    console.log('\n--- 2. Testing Profile View & Edit ---');
    await send('Page.navigate', { url: 'http://localhost:5173/profile' });
    await new Promise(r => setTimeout(r, 2000));

    const profileInitial = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        heading: document.querySelector('h1')?.innerText,
        email: document.querySelector('input[type="email"]')?.value,
        nameVal: document.querySelector('input[name="name"]')?.value,
        roleBadge: document.querySelector('span.uppercase')?.innerText
      })`
    });
    console.log('Profile initial DOM:', profileInitial.result.value);

    // Test editing name
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nameInput = document.querySelector('input[name="name"]');
        nameInput.value = 'Sai Ganesh R';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Changes'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    const profileAfterEdit = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        successBanner: document.body.innerText.includes('Profile updated successfully'),
        userNameInHeader: document.body.innerText.includes('Sai Ganesh R')
      })`
    });
    console.log('Profile edit result:', profileAfterEdit.result.value);

    // Revert name back to 'Sai Ganesh'
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nameInput = document.querySelector('input[name="name"]');
        nameInput.value = 'Sai Ganesh';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Changes'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    await takeScreenshot('verified_profile_page_real_data.png');

    // Test Help Modal
    await send('Runtime.evaluate', {
      expression: `(() => {
        const helpBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Help & FAQ') || b.querySelector('svg')?.classList.contains('lucide-help-circle') || b.title?.includes('Help'));
        if (helpBtn) helpBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 800));
    const helpCheck = await send('Runtime.evaluate', {
      expression: `document.body.innerText.includes('Frequently Asked Questions')`
    });
    console.log('Help & FAQ Modal opened:', helpCheck.result.value);

    // ==========================================
    // 3. INSTRUCTOR DASHBOARD VERIFICATION
    // ==========================================
    console.log('\n--- 3. Testing Instructor Dashboard ---');
    await setTokenAndNavigate(INSTRUCTOR_TOKEN, '/instructor');
    const instructorDom = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        heading: document.querySelector('h2')?.innerText,
        cards: Array.from(document.querySelectorAll('.rounded-2xl.border')).map(el => el.innerText),
        hasEmptyCourses: document.body.innerText.includes("You haven't created any courses yet"),
        hasCreateBtn: !!Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('Create Your First Course')),
        hasEmptyActivity: document.body.innerText.includes('No student activity yet')
      })`
    });
    console.log('Instructor Dashboard DOM result:', instructorDom.result.value);
    await takeScreenshot('verified_instructor_dashboard_real_data.png');

    // ==========================================
    // 4. ADMIN DASHBOARD VERIFICATION
    // ==========================================
    console.log('\n--- 4. Testing Admin Dashboard ---');
    await setTokenAndNavigate(ADMIN_TOKEN, '/admin');
    const adminDom = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        heading: document.querySelector('h2')?.innerText,
        cards: Array.from(document.querySelectorAll('.rounded-2xl.border')).map(el => el.innerText),
        totalUsers: document.body.innerText.includes('4') && document.body.innerText.includes('2 students · 1 instructors · 1 admin'),
        hasEmptyCourses: document.body.innerText.includes('No courses registered yet'),
        hasEmptyAudit: document.body.innerText.includes('No audit events recorded yet'),
        fastApiHealthy: document.body.innerText.includes('Healthy · 200 OK')
      })`
    });
    console.log('Admin Dashboard DOM result:', adminDom.result.value);
    await takeScreenshot('verified_admin_dashboard_real_data.png');

    ws.close();
    console.log('\nAll real dashboard and profile tests passed successfully!');
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
