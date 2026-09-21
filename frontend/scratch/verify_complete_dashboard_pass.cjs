const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\jeyav\\.gemini\\antigravity\\brain\\ed7979cd-00c6-4a96-a0ac-81c8a8a0dbfe';

async function verifyAll() {
  console.log('Launching Headless Chrome...');
  const chromeProc = spawn(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--user-data-dir=C:\\Users\\jeyav\\AppData\\Local\\Temp\\chrome-cdp-verify-pass',
      '--no-first-run',
    ]
  );

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
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
    await send('Fetch.enable', {
      patterns: [{ urlPattern: '*api/v1*' }]
    });

    let currentUserRole = 'STUDENT';
    let currentUserName = 'Alex Morgan';

    // Intercept mock API calls
    ws.addEventListener('message', async (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.method === 'Fetch.requestPaused') {
        const { requestId, request } = msg.params;
        const url = request.url;

        let responseBody = {};
        if (url.includes('/auth/me')) {
          responseBody = {
            id: 'mock-user-1',
            name: currentUserName,
            email: `${currentUserRole.toLowerCase()}@kitsuno.ai`,
            role: currentUserRole,
            created_at: new Date().toISOString()
          };
        } else if (url.includes('/enrollments')) {
          responseBody = [];
        } else if (url.includes('/courses')) {
          responseBody = [
            {
              id: 'c1',
              title: 'Applied Machine Learning & Deep Neural Networks',
              category: 'Artificial Intelligence',
              difficulty: 'INTERMEDIATE',
              instructor_id: 'mock-user-1',
              is_published: true,
              enrolled_count: 142,
              quizzes_count: 18,
              completion_rate: 78
            },
            {
              id: 'c2',
              title: 'Full-Stack Web Architecture & Cloud Microservices',
              category: 'Web Development',
              difficulty: 'BEGINNER',
              instructor_id: 'mock-user-1',
              is_published: true,
              enrolled_count: 86,
              quizzes_count: 12,
              completion_rate: 82
            }
          ];
        } else if (url.includes('/analytics/admin')) {
          responseBody = {
            total_users: 1420,
            total_courses: 48,
            total_quizzes: 3890,
            system_uptime: 99.8
          };
        }

        const bodyBase64 = Buffer.from(JSON.stringify(responseBody)).toString('base64');
        await send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders: [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Access-Control-Allow-Origin', value: '*' },
            { name: 'Access-Control-Allow-Headers', value: '*' },
          ],
          body: bodyBase64
        });
      }
    });

    // Helper for taking full-page or element screenshots
    async function capture(filename) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    // Set desktop resolution
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    // ----------------------------------------------------
    // TEST 1: STUDENT DASHBOARD
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Student Dashboard ---');
    currentUserRole = 'STUDENT';
    currentUserName = 'Alex Morgan';

    await send('Page.navigate', { url: 'http://localhost:5173/login' });
    await new Promise((r) => setTimeout(r, 800));
    await send('Runtime.evaluate', {
      expression: `localStorage.setItem('access_token', 'mock_student_token');`
    });

    await send('Page.navigate', { url: 'http://localhost:5173/student' });
    await new Promise((r) => setTimeout(r, 2000));
    await capture('verified_student_dashboard_desktop.png');

    // Click interactive quiz option [ ReLU ]
    console.log('Testing interactive quiz selection on student dashboard...');
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const reluBtn = btns.find(b => b.textContent.includes('ReLU'));
        if (reluBtn) reluBtn.click();
      `
    });
    await new Promise((r) => setTimeout(r, 600));
    await capture('verified_student_quiz_interaction.png');

    // ----------------------------------------------------
    // TEST 2: INSTRUCTOR DASHBOARD
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Instructor Dashboard ---');
    currentUserRole = 'INSTRUCTOR';
    currentUserName = 'Dr. Marcus Vance';

    await send('Page.navigate', { url: 'http://localhost:5173/instructor' });
    await new Promise((r) => setTimeout(r, 2000));
    await capture('verified_instructor_dashboard_desktop.png');

    // ----------------------------------------------------
    // TEST 3: ADMIN DASHBOARD
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Admin Dashboard ---');
    currentUserRole = 'ADMIN';
    currentUserName = 'Elena Rostova';

    await send('Page.navigate', { url: 'http://localhost:5173/admin' });
    await new Promise((r) => setTimeout(r, 2000));
    await capture('verified_admin_dashboard_desktop.png');

    // ----------------------------------------------------
    // TEST 4: LANDING NAVBAR CLOSED & HOVER EXPANDED
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Landing Navbar Logo Halo & Hover ---');
    await send('Runtime.evaluate', {
      expression: `localStorage.removeItem('access_token');`
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    // Wait for intro animation to complete (approx 3s)
    await new Promise((r) => setTimeout(r, 3800));

    // Navbar closed
    await capture('verified_landing_navbar_closed.png');

    // Hover over navbar
    await send('Runtime.evaluate', {
      expression: `
        const nav = document.querySelector('.ks-nav');
        if (nav) {
          nav.classList.add('is-open');
        }
      `
    });
    await new Promise((r) => setTimeout(r, 500));
    await capture('verified_landing_navbar_expanded.png');

    // ----------------------------------------------------
    // TEST 5: FOOTER PEEPING CAT WALL CLIPPING
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Footer Peeping Cat Wall Clipping ---');
    await send('Runtime.evaluate', {
      expression: `window.scrollTo(0, document.body.scrollHeight);`
    });
    await new Promise((r) => setTimeout(r, 1200));
    await capture('verified_footer_cat_wall_clip.png');

    // ----------------------------------------------------
    // TEST 6: MOBILE STUDENT DASHBOARD (375x812)
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Mobile Student Dashboard ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });
    currentUserRole = 'STUDENT';
    currentUserName = 'Alex Morgan';
    await send('Runtime.evaluate', {
      expression: `localStorage.setItem('access_token', 'mock_student_token');`
    });
    await send('Page.navigate', { url: 'http://localhost:5173/student' });
    await new Promise((r) => setTimeout(r, 2000));
    await capture('verified_student_dashboard_mobile.png');

    console.log('\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===');
    ws.close();
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    chromeProc.kill();
  }
}

verifyAll();
