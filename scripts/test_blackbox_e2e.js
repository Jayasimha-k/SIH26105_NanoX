/**
 * test_blackbox_e2e.js
 * True End-to-End Black-Box Runtime Audit for CyberOptRQ SIH Demo.
 * Runs on real Microsoft Edge via Chrome DevTools Protocol (CDP).
 */

const { spawn } = require('child_process');
const http = require('http');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CDP_PORT = 9222;

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.consoleErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((res, rej) => {
      this.ws.onopen = res;
      this.ws.onerror = rej;
    });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.exceptionThrown') {
          this.consoleErrors.push({
            type: 'EXCEPTION',
            text: msg.params.exceptionDetails.text,
            description: msg.params.exceptionDetails.exception?.description || ''
          });
        }
        if (msg.method === 'Network.responseReceived' && msg.params.response.status === 401) {
          this.consoleErrors.push({
            type: '401_RESPONSE',
            url: msg.params.response.url
          });
        }
        if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
          this.consoleErrors.push({
            type: 'LOG_ERROR',
            text: msg.params.entry.text
          });
        }
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      } catch (e) {}
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function audit() {
  console.log('================================================================');
  console.log('CYBEROPTRQ TRUE BLACK-BOX RUNTIME AUDIT (MICROSOFT EDGE CDP)');
  console.log('================================================================\n');

  // Step 1: Reset attack state to baseline
  console.log('[1/7] Resetting backend demo state to Baseline...');
  try {
    const resetRes = await fetch('http://localhost:8000/api/v1/demo/attack/reset', { method: 'POST' });
    console.log(`      Backend reset status: ${resetRes.status}`);
  } catch (err) {
    console.warn(`      Backend reset call warning: ${err.message}`);
  }

  // Step 2: Spawn Edge with disabled extensions to ensure pure browser environment
  console.log('\n[2/7] Launching Microsoft Edge in headless CDP mode...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'about:blank'
  ], { detached: false });

  await sleep(2000);

  try {
    const version = await getJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    console.log(`      Connected to Edge: ${version['Browser']}`);

    const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension://')) || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    console.log('\n[3/7] Navigating to CyberOptRQ Frontend (http://localhost:5173)...');
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Network.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2500);

    // If on Marketing page, click [ BOOK DEMO ] to enter app view
    const entry = await cdp.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b =>
          b.textContent.includes('BOOK DEMO') || b.textContent.includes('Live Demo')
        );
        if (btn) {
          btn.click();
          return 'Navigated via BOOK DEMO';
        }
        return 'Direct app landing';
      })()
    `);
    console.log(`      Landing: ${entry}`);
    await sleep(2000);

    // Step 4: Verify Baseline Dashboard UI metrics
    console.log('\n[4/7] Auditing Baseline Dashboard UI metrics in real browser DOM...');
    const baselineCheck = await cdp.eval(`
      (() => {
        const bodyText = document.body.innerText;
        const hasRiskScore = bodyText.includes('78%') || bodyText.includes('BASELINE NORMAL');
        const hasEal = bodyText.includes('395.4') || bodyText.includes('39,543,000') || bodyText.includes('EAL');
        const hasOrg = bodyText.includes('ABC Tech') || bodyText.includes('org_abc_tech');
        return {
          hasRiskScore,
          hasEal,
          hasOrg,
          title: document.title,
          sample: bodyText.slice(0, 180).replace(/\\n/g, ' ')
        };
      })()
    `);
    console.log('      Baseline check:', JSON.stringify(baselineCheck));

    // Step 5: Launch Controlled Attack Demo
    console.log('\n[5/7] Triggering Authorized Attack Simulation...');
    const attackRes = await fetch('http://localhost:8000/api/v1/demo/attack/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: 'strix_container_escape_pentest',
        organization_id: 'org_abc_tech',
        asset_id: 'ASSET-001'
      })
    });
    const attackData = await attackRes.json();
    console.log(`      Attack started! Correlation ID: ${attackData.correlation_id || 'OK'}`);

    // Allow frontend polling / WebSocket to receive state and transition
    console.log('      Waiting for Frontend to transition into Attack Mode...');
    await sleep(3500);

    // Verify Attack HUD & Dynamic Reaction in Real Browser DOM
    const attackHudCheck = await cdp.eval(`
      (() => {
        const hud = document.getElementById('spotlight-attack-mode');
        const video = document.getElementById('bad-apple-video');
        const body = document.body.innerText;
        
        const hasHud = !!hud;
        const hasVideo = !!video;
        const hasSpikeScore = body.includes('96%') || body.includes('CRITICAL');
        const hasSpikeEal = body.includes('613.7') || body.includes('61,371,720');
        const hasTargetAsset = body.includes('ASSET-001') || body.includes('Core Oracle');
        const hasDeployBtn = Array.from(document.querySelectorAll('button')).some(b =>
          b.textContent.includes('DEPLOY REMEDIATION') || b.textContent.includes('EMERGENCY MITIGATION')
        );

        return {
          hasHud,
          hasVideo,
          hasSpikeScore,
          hasSpikeEal,
          hasTargetAsset,
          hasDeployBtn,
          hudSnippet: hud ? hud.innerText.slice(0, 200).replace(/\\n/g, ' ') : 'NOT_FOUND'
        };
      })()
    `);
    console.log('      Attack HUD DOM Check:', JSON.stringify(attackHudCheck, null, 2));

    // Step 6: Deploy Remediation from the UI
    console.log('\n[6/7] Clicking "DEPLOY REMEDIATION" button in real browser...');
    const remediationClick = await cdp.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b =>
          b.textContent.includes('DEPLOY REMEDIATION') || b.textContent.includes('EMERGENCY MITIGATION')
        );
        if (btn) {
          btn.click();
          return { clicked: true, text: btn.textContent.trim() };
        }
        return { clicked: false };
      })()
    `);
    console.log('      Remediation button action:', JSON.stringify(remediationClick));
    await sleep(4000);

    // Check Post-Remediation Residual State
    const remediationDomCheck = await cdp.eval(`
      (() => {
        const body = document.body.innerText;
        const hasResidualScore = body.includes('14%') || body.includes('Remediated') || body.includes('Remediation confirmed');
        const hasResidualEal = body.includes('63.3') || body.includes('6,326,880') || body.includes('Fabric ledger');
        return {
          hasResidualScore,
          hasResidualEal,
          statusSample: body.slice(0, 300).replace(/\\n/g, ' ')
        };
      })()
    `);
    console.log('      Post-Remediation DOM Check:', JSON.stringify(remediationDomCheck));

    // Step 7: Navigation across other views to test for crashes or blank screens
    console.log('\n[7/7] Testing all major navigation tabs for runtime health...');
    const navItems = [
      { name: 'Continuous Intel & HITL', selector: 'button', text: 'Continuous Intel' },
      { name: 'Threat Intelligence', selector: 'button', text: 'Threat Intelligence' },
      { name: 'Financial Risk (FAIR EAL)', selector: 'button', text: 'Financial Risk' },
      { name: 'Consortium Blockchain', selector: 'button', text: 'Consortium Blockchain' },
      { name: 'Investment Optimization', selector: 'button', text: 'Investment Optimization' },
      { name: 'Return to Executive Risk Overview', selector: 'button', text: 'Executive Risk Overview' }
    ];

    const viewResults = [];
    for (const v of navItems) {
      const clickRes = await cdp.eval(`
        (() => {
          const tab = Array.from(document.querySelectorAll('${v.selector}')).find(el =>
            el.textContent.includes('${v.text}')
          );
          if (tab) {
            tab.click();
            return { clicked: true, text: tab.textContent.trim() };
          }
          return { clicked: false };
        })()
      `);
      await sleep(1500);

      const health = await cdp.eval(`
        (() => {
          const errOverlay = document.querySelector('vite-error-overlay');
          const hasCrash = document.body.innerText.includes('Cannot read properties') ||
                           document.body.innerText.includes('is not a function') ||
                           document.body.innerText.includes('ReferenceError') ||
                           document.body.innerText.includes('Something went wrong');
          return {
            hasCrash,
            hasErrorOverlay: !!errOverlay,
            contentLength: document.body.innerText.length
          };
        })()
      `);

      viewResults.push({
        view: v.name,
        clicked: clickRes?.clicked,
        healthy: !health?.hasCrash && !health?.hasErrorOverlay && (health?.contentLength > 50)
      });
      console.log(`      Tab [${v.name}]: Clicked=${clickRes?.clicked}, Healthy=${!health?.hasCrash && !health?.hasErrorOverlay}`);
    }

    console.log('\n================================================================');
    console.log('E2E BLACK-BOX AUDIT SUMMARY');
    console.log('================================================================');
    const allViewsHealthy = viewResults.every(r => r.healthy);
    const attackHudPassed = attackHudCheck?.hasHud && attackHudCheck?.hasSpikeScore && attackHudCheck?.hasSpikeEal;
    const remediationPassed = remediationClick?.clicked && remediationDomCheck?.hasResidualScore;
    const noConsoleErrors = cdp.consoleErrors.length === 0;

    console.log(`1. Baseline State Validation:  ${baselineCheck?.hasRiskScore ? 'PASS' : 'FAIL'}`);
    console.log(`2. Attack HUD & Metric Surge:  ${attackHudPassed ? 'PASS' : 'FAIL'}`);
    console.log(`3. Embedded Bad Apple Video:   ${attackHudCheck?.hasVideo ? 'PASS' : 'FAIL'}`);
    console.log(`4. Remediation Action & Drop:  ${remediationPassed ? 'PASS' : 'FAIL'}`);
    console.log(`5. Cross-View Navigation:      ${allViewsHealthy ? 'PASS' : 'FAIL'}`);
    console.log(`6. Browser Console Zero Errors: ${noConsoleErrors ? 'PASS' : 'FAIL'}`);
    if (!noConsoleErrors) {
      console.log('   Console Errors:', JSON.stringify(cdp.consoleErrors, null, 2));
    }
    console.log('================================================================\n');

    cdp.close();
  } catch (err) {
    console.error('Audit exception:', err);
  } finally {
    edgeProc.kill();
  }
}

audit();
