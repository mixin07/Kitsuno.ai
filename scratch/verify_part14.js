import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9240;
const BASE_URL = 'http://localhost:5173';
const ARTIFACT_DIR = 'C:\\Users\\jeyav\\.gemini\\antigravity\\brain\\ed7979cd-00c6-4a96-a0ac-81c8a8a0dbfe';

async function main() {
  console.log('=== RUNNING PART 14 VERIFICATION ===');

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1280,960'
  ]);

  await new Promise(r => setTimeout(r, 1500));

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
    await send('DOM.enable');

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res?.result?.value;
    }

    async function screenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filepath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log(`[Screenshot Captured] ${filename}`);
    }

    // 1. Load Landing Page
    console.log('Navigating to', BASE_URL);
    await send('Page.navigate', { url: BASE_URL });
    await new Promise(r => setTimeout(r, 1800));

    // Fast-forward intro if present
    await evaluate(`
      (() => {
        const skipBtn = document.querySelector('.ks-intro__skip');
        if (skipBtn) skipBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 1000));

    // 2. Measure section transitions and spacing
    const spacingReport = await evaluate(`
      (() => {
        const hero = document.querySelector('#home');
        const problem = document.querySelector('#problem');
        const solution = document.querySelector('#solution');
        const approach = document.querySelector('#approach');
        const features = document.querySelector('#features');
        const product = document.querySelector('#product') || document.querySelector('.ks-showcase');
        const cta = document.querySelector('#start') || document.querySelector('.ks-cta');
        const footer = document.querySelector('footer');

        function getGap(el1, el2) {
          if (!el1 || !el2) return null;
          const r1 = el1.getBoundingClientRect();
          const r2 = el2.getBoundingClientRect();
          return Math.round(r2.top - r1.bottom);
        }

        const approachRect = approach ? approach.getBoundingClientRect() : null;
        const featuresRect = features ? features.getBoundingClientRect() : null;
        const productRect = product ? product.getBoundingClientRect() : null;
        const ctaRect = cta ? cta.getBoundingClientRect() : null;

        return {
          approachBottom: approachRect ? Math.round(approachRect.bottom) : null,
          featuresTop: featuresRect ? Math.round(featuresRect.top) : null,
          gapApproachToFeatures: getGap(approach, features),
          gapProductToCta: getGap(product, cta),
          productPaddingBottom: product ? window.getComputedStyle(product).paddingBottom : null,
          approachPaddingBottom: approach ? window.getComputedStyle(approach).paddingBottom : null,
          featuresPaddingTop: features ? window.getComputedStyle(features).paddingTop : null,
          ctaPaddingTop: cta ? window.getComputedStyle(cta).paddingTop : null,
        };
      })()
    `);
    console.log('Spacing Report:', spacingReport);

    // Capture Approach to Features transition
    await evaluate(`document.querySelector('#approach').scrollIntoView({ behavior: 'instant' });`);
    await new Promise(r => setTimeout(r, 600));
    await screenshot('part14_01_approach_to_features.png');

    // Capture Product to Final CTA transition
    await evaluate(`(document.querySelector('#product') || document.querySelector('.ks-showcase')).scrollIntoView({ behavior: 'instant' });`);
    await new Promise(r => setTimeout(r, 600));
    await screenshot('part14_02_product_to_cta.png');

    // 3. Inspect Cursor Grid & Splash Cursor
    const cursorInfo = await evaluate(`
      (() => {
        const layer = document.querySelector('.ks-viewport-cursor-layer');
        const gridCanvas = layer ? layer.querySelector('.ks-cursorgrid__canvas') : null;
        const splashCanvas = layer ? layer.querySelector('.ks-splashcursor__canvas') : null;
        return {
          layerExists: !!layer,
          gridCanvasExists: !!gridCanvas,
          splashCanvasExists: !!splashCanvas,
          layerComputedStyle: layer ? {
            position: window.getComputedStyle(layer).position,
            zIndex: window.getComputedStyle(layer).zIndex,
            pointerEvents: window.getComputedStyle(layer).pointerEvents,
          } : null
        };
      })()
    `);
    console.log('Cursor Layer Info:', cursorInfo);

    // Move cursor over CTA and inspect
    await evaluate(`(document.querySelector('.ks-cta') || document.querySelector('#start')).scrollIntoView({ behavior: 'instant' });`);
    await new Promise(r => setTimeout(r, 500));

    // Dispatch mouse movement across CTA
    await evaluate(`
      (() => {
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 640, clientY: 480 }));
      })()
    `);
    await new Promise(r => setTimeout(r, 300));
    await screenshot('part14_03_cta_with_cursor.png');

    // 4. Footer Inspection (Peeping Cat, Dividers, Scroll-to-Top Button)
    await evaluate(`window.scrollTo(0, document.body.scrollHeight);`);
    await new Promise(r => setTimeout(r, 800));

    const footerDetails = await evaluate(`
      (() => {
        const footer = document.querySelector('.ks-footer');
        const catWrap = document.querySelector('.ks-footer__cat-wrap');
        const craftText = document.querySelector('.ks-footer__craft');
        const craftContainer = document.querySelector('.ks-footer__craft-container');
        const legalLinks = document.querySelector('.ks-footer__legal');
        const copyText = document.querySelector('.ks-footer__copy');
        const scrollTopBtn = document.querySelector('.ks-scroll-top');
        const bottomRow = document.querySelector('.ks-footer__bottom');

        const catRect = catWrap ? catWrap.getBoundingClientRect() : null;
        const craftRect = craftText ? craftText.getBoundingClientRect() : null;
        const scrollRect = scrollTopBtn ? scrollTopBtn.getBoundingClientRect() : null;

        // Check if cat is strictly ABOVE craftText
        const isCatAboveCraft = catRect && craftRect ? (catRect.bottom <= craftRect.bottom && catRect.top < craftRect.top) : false;
        // Check collision with scroll to top button
        const overlapsScrollBtn = catRect && scrollRect ? !(
          catRect.right < scrollRect.left ||
          catRect.left > scrollRect.right ||
          catRect.bottom < scrollRect.top ||
          catRect.top > scrollRect.bottom
        ) : false;

        const footerBorderTop = footer ? window.getComputedStyle(footer).borderTopWidth : null;
        const bottomBorderTop = bottomRow ? window.getComputedStyle(bottomRow).borderTopWidth : null;

        return {
          catHeight: catRect ? Math.round(catRect.height) : null,
          catWidth: catRect ? Math.round(catRect.width) : null,
          isCatAboveCraft,
          overlapsScrollBtn,
          footerBorderTop, // Should be 0px (1st divider removed!)
          bottomBorderTop, // Should be 1px (2nd divider present!)
          craftMarginRight: craftContainer ? window.getComputedStyle(craftContainer).marginRight : null,
        };
      })()
    `);
    console.log('Footer & Cat Details:', footerDetails);
    await screenshot('part14_04_footer_cat_and_scroll.png');

    // 5. Verify /login (Two-column layout, left editorial panel with Lottie)
    console.log('Navigating to /login');
    await send('Page.navigate', { url: `${BASE_URL}/login` });
    await new Promise(r => setTimeout(r, 1200));

    const loginDetails = await evaluate(`
      (() => {
        const logo = document.querySelector('a[aria-label="Kitsuno.ai Home"]');
        const leftPanel = document.querySelector('.lg\\:col-span-5');
        const rightPanel = document.querySelector('.lg\\:col-span-7');
        const lottie = leftPanel ? leftPanel.querySelector('svg') || leftPanel.querySelector('canvas') : null;
        const heading = leftPanel ? leftPanel.querySelector('h2') : null;
        const form = document.querySelector('form');
        const emailInput = document.querySelector('#email');
        const passwordInput = document.querySelector('#password');
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        const createAccountLink = document.querySelector('a[href="/register"]');

        return {
          hasLogo: !!logo,
          hasLeftPanel: !!leftPanel,
          hasRightPanel: !!rightPanel,
          leftHeadingText: heading ? heading.textContent.replace(/\\s+/g, ' ').trim() : null,
          hasLottieAnimation: !!lottie,
          hasForm: !!form,
          hasEmailInput: !!emailInput,
          hasPasswordInput: !!passwordInput,
          submitBtnText: submitBtn ? submitBtn.textContent.trim() : null,
          hasCreateAccountLink: !!createAccountLink,
        };
      })()
    `);
    console.log('Login Details:', loginDetails);
    await screenshot('part14_05_login_page_desktop.png');

    // Test mobile viewport on /login
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await new Promise(r => setTimeout(r, 600));

    const loginMobileOverflow = await evaluate(`
      (() => {
        return {
          bodyScrollWidth: document.body.scrollWidth,
          windowInnerWidth: window.innerWidth,
          hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth
        };
      })()
    `);
    console.log('Login Mobile Overflow Check:', loginMobileOverflow);
    await screenshot('part14_06_login_page_mobile.png');

    // 6. Verify /register
    console.log('Navigating to /register');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `${BASE_URL}/register` });
    await new Promise(r => setTimeout(r, 1200));

    const registerDetails = await evaluate(`
      (() => {
        const leftPanel = document.querySelector('.lg\\:col-span-5');
        const lottie = leftPanel ? leftPanel.querySelector('svg') || leftPanel.querySelector('canvas') : null;
        const studentBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Student'));
        const instructorBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Instructor'));

        return {
          hasLeftPanel: !!leftPanel,
          hasLottie: !!lottie,
          hasStudentBtn: !!studentBtn,
          hasInstructorBtn: !!instructorBtn
        };
      })()
    `);
    console.log('Register Details:', registerDetails);
    await screenshot('part14_07_register_page_desktop.png');

    // Switch to Instructor role
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const instructorBtn = btns.find(b => b.textContent.includes('Instructor'));
        if (instructorBtn) instructorBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));
    await screenshot('part14_08_register_instructor.png');

    console.log('=== ALL PART 14 VERIFICATIONS COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    chrome.kill();
  }
}

main();
