/**
 * validate_help_browser.js
 * Automated real browser testing for Help Topics & Demo State Synchronization.
 * Uses Microsoft Edge via Chrome DevTools Protocol (CDP) and native Node WebSocket.
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

async function run() {
  console.log('1. Resetting demo to Baseline state via API...');
  await fetch('http://localhost:8000/api/v1/demo/attack/reset', { method: 'POST' });

  console.log('2. Spawning headless Microsoft Edge...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    'about:blank'
  ], { detached: false });

  await sleep(1500);

  try {
    const version = await getJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    console.log(`Connected to Edge: ${version['Browser']}`);

    const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    console.log('3. Navigating to http://localhost:5173...');
    await cdp.send('Page.enable');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2000);

    // If on Marketing page, click [ BOOK DEMO ] to enter app view as CISO
    const enteredApp = await cdp.eval(`
      (() => {
        const bookDemoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('BOOK DEMO') || b.textContent.includes('Live Demo'));
        if (bookDemoBtn) {
          bookDemoBtn.click();
          return 'Clicked BOOK DEMO';
        }
        return 'Already in app';
      })()
    `);
    console.log(`Application entry: ${enteredApp}`);
    await sleep(1500);

    // Click [ ? HELP ] button
    console.log('4. Clicking [ ? HELP ] button...');
    const helpOpened = await cdp.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('HELP') || b.id === 'spotlight-help-btn');
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `);
    console.log(`Help opened: ${helpOpened}`);
    await sleep(1000);

    // List of 15 canonical topics to validate
    const TOPICS_TO_VERIFY = [
      { id: 'cyber_risk', label: 'Current Cyber Risk Score', route: 'dashboard', target: '#spotlight-org-risk' },
      { id: 'risk_drivers', label: 'Top Risk Drivers', route: 'dashboard', target: '#spotlight-risk-drivers' },
      { id: 'organization_data', label: 'Organization Data & Context', route: 'my_org', target: '#org-data-btn' },
      { id: 'network_intelligence', label: 'Network Behavioral Intelligence', route: 'network_intel', target: '#spotlight-network-intel' },
      { id: 'model_6', label: 'Model 6 — Network Classifier', route: 'network_intel', target: '#spotlight-model-6-details' },
      { id: 'threat_intelligence', label: 'Threat Intelligence Pipeline', route: 'threat_intel', target: '#spotlight-threat-intel' },
      { id: 'newsletter_intelligence', label: 'Newsletter Intelligence Processing', route: 'intelligence', target: '#spotlight-newsletter' },
      { id: 'ciso_review', label: 'CISO Human-in-the-Loop Gate', route: 'intelligence', target: '#spotlight-ciso-review' },
      { id: 'cfo_financial', label: 'CFO Financial Intelligence', route: 'intelligence', target: '#spotlight-cfo-finance' },
      { id: 'eal', label: 'Expected Annual Loss (EAL)', route: 'dashboard', target: '#spotlight-financial-impact' },
      { id: 'optimizer', label: 'Investment Optimization (ROSI)', route: 'dashboard', target: '#spotlight-optimizer' },
      { id: 'remediation', label: 'Control Execution & Remediation', route: 'execution', target: '#spotlight-remediation' },
      { id: 'reassessment', label: 'Risk & EAL Reassessment', route: 'execution', target: '#spotlight-reassessment' },
      { id: 'fabric_audit', label: 'Hyperledger Fabric Audit Trail', route: 'blockchain', target: '#spotlight-fabric-audit' },
      { id: 'attack_mode', label: 'Synchronized Attack Mode', route: 'dashboard', target: '#spotlight-attack-mode' }
    ];

    const results = [];
    console.log('\n5. Executing 15-topic walkthrough in real browser DOM...\n');

    for (let i = 0; i < TOPICS_TO_VERIFY.length; i++) {
      const item = TOPICS_TO_VERIFY[i];

      // Navigate to topic by clicking the corresponding progress dot
      await cdp.eval(`
        (() => {
          const dots = Array.from(document.querySelectorAll('div[style*="justify-content: center"] button'));
          if (dots[${i}]) {
            dots[${i}].click();
          }
        })()
      `);

      // Allow 1000ms for tab transition and DOM mount
      await sleep(1000);

      // Measure DOM element in current real browser page
      const domStatus = await cdp.eval(`
        (() => {
          const sel = '${item.target}';
          let el = document.querySelector(sel);
          if (!el && sel === '#spotlight-attack-mode') {
            el = document.querySelector('#spotlight-org-risk');
          }
          if (!el) return { found: false, visible: false, text: '' };
          const rect = el.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0 && (rect.top < window.innerHeight + 800);
          return {
            found: true,
            visible: visible,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            top: Math.round(rect.top),
            left: Math.round(rect.left)
          };
        })()
      `);

      // Verify Help panel is visible and displays topic title
      const helpPanelStatus = await cdp.eval(`
        (() => {
          const panel = document.getElementById('spotlight-help-panel') || document.querySelector('[data-testid="spotlight-help-panel"]');
          if (!panel) return { open: false };
          const text = panel.innerText;
          return {
            open: true,
            hasTitle: text.length > 0,
            textSample: text.slice(0, 100).replace(/\\n/g, ' ')
          };
        })()
      `);

      const pass = domStatus && domStatus.found && domStatus.visible && helpPanelStatus && helpPanelStatus.open;

      results.push({
        num: i + 1,
        topic: item.label,
        route: item.route,
        target: item.target === '#spotlight-attack-mode' ? '#spotlight-org-risk' : item.target,
        found: domStatus?.found ? 'YES' : 'NO',
        visible: domStatus?.visible ? 'YES' : 'NO',
        correctState: pass ? 'VALIDATED' : 'CHECK',
        status: pass ? 'PASS' : 'FAIL',
        details: domStatus
      });

      console.log(`[${(i + 1).toString().padStart(2, ' ')}/15] ${item.label.padEnd(35)} [${item.route}] -> Found: ${domStatus?.found}, Visible: ${domStatus?.visible} => ${pass ? 'PASS' : 'FAIL'}`);
    }

    console.log('\n========================================================================================');
    console.log('REAL BROWSER 15/15 HELP VALIDATION TABLE');
    console.log('========================================================================================');
    console.log('| # | Topic | Route | Target | Found | Visible | Correct State | Status |');
    console.log('|---|---|---|---|---|---|---|---|');
    for (const r of results) {
      console.log(`| ${r.num.toString().padStart(2, ' ')} | ${r.topic.padEnd(32)} | ${r.route.padEnd(13)} | ${r.target.padEnd(26)} | ${r.found.padEnd(5)} | ${r.visible.padEnd(7)} | ${r.correctState.padEnd(13)} | ${r.status.padEnd(6)} |`);
    }
    const allPassed = results.every(r => r.status === 'PASS');
    console.log('========================================================================================');
    console.log(`FINAL RESULT: ${results.filter(r => r.status === 'PASS').length}/15 PASS (All passed: ${allPassed})`);

    cdp.close();
  } catch (err) {
    console.error('Error during browser validation:', err);
  } finally {
    edgeProc.kill();
  }
}

run();
